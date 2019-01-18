export interface SlicknodeRuntimeOptions {
  secret?: string;
  maxClockDrift?: number;
}

export interface RuntimeResponse<TData = any> {
  data?: TData;
  error?: {
    message: string,
  };
}

/**
 * Information about the request, settings for the module etc
 * that is passed to the function handler as second argument
 */
export interface RuntimeContext<TSettings = SettingsValueMap> {
  request: {
    /**
     * The IP address of the client
     */
    ip: string,

    /**
     * The unique request id as UUID string
     */
    id: string,
  };
  project: {
    /**
     * The project alias
     */
    alias: string,
  };
  settings: TSettings;
}

/**
 * The payload that is passed to resolvers
 */
export interface ResolverPayload<TArgs = {[name: string]: any}, TSource = any> {
  event: string;
  args: TArgs;
  source: TArgs;
}

/**
 * Configuration for API keys and other settings
 */
export type SettingsValue = string | boolean | number;
export interface SettingsValueMap {
  [key: string]: SettingsValue;
}

export interface RuntimeRequest<TPayload = any> {
  /**
   * The slicknode module ID
   */
  module: string;

  /**
   * The handler as configured in the slicknode.yml
   */
  handler: string;

  /**
   * Payload to be passed to the function
   */
  payload: TPayload;

  /**
   * The request context
   */
  context: RuntimeContext;
}

export interface Headers {
  [name: string]: string;
}
