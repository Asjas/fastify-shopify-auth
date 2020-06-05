export type AccessMode = 'online' | 'offline';

export interface AuthConfig {
  apiKey: string;
  secret: string;
  shop: string;
  host: string;
  accessMode?: 'online' | 'offline';
  afterAuth?(): void;
}

export interface OAuthStartOptions extends AuthConfig {
  prefix?: string;
  scopes?: string[];
}
