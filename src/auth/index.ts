import fp from 'fastify-plugin';
import nonce from 'nonce';
import ShopifyToken from 'shopify-token';
import { OAuthStartOptions } from '../types';

async function createShopifyAuth(fastify, options: OAuthStartOptions) {
  const createNonce = nonce();
  const requestNonce = createNonce();

  const config = {
    scopes: [],
    prefix: '',
    accessMode: 'online',
    nonce: requestNonce,
    ...options,
  };

  const { prefix } = config;

  const oAuthStartPath = `${prefix}/auth`;
  const oAuthCallbackPath = `${oAuthStartPath}/callback`;

  const shopifyToken = new ShopifyToken({
    sharedSecret: config.secret,
    redirectUri: `${config.host}${oAuthCallbackPath}`,
    apiKey: config.apiKey,
  });

  const shopifyAuthUrl = shopifyToken.generateAuthUrl(config.shop, config.scopes, config.nonce, config.accessMode);

  fastify.addHook('onRequest', async (request, reply) => {
    if (request.url === oAuthStartPath) {
      reply.setCookie('shopifyNonce', config.nonce, {
        sameSite: 'none',
        secure: true,
      });

      reply.redirect(shopifyAuthUrl);
    }

    if (request.url.startsWith(oAuthCallbackPath)) {
      const ok = shopifyToken.verifyHmac(request.query);

      if (ok) {
        shopifyToken
          .getAccessToken(request.query.shop, request.query.code)
          .then((data: any) => {
            request.session.access_token = data.access_token;
            // => { access_token: 'f85632530bf277ec9ac6f649fc327f17', scope: 'read_content' }
            console.log('🔥', data);
          })
          .catch(err => console.error(err));
      }
    }
  });
}

export default fp(createShopifyAuth);
