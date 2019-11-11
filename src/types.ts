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
  api: {
    /**
     * Temporary access token to be sent in the headers to the API
     * Has role RUNTIME plus all roles of the user that made the initial request
     */
    accessToken: string,

    /**
     * The Slicknode GraphQL API endpoint
     */
    endpoint: string,
  };
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

export interface AfterMutationListenerPayload<
  TData = {[name: string]: any},
  TArgs = {[name: string]: any}
> {
  /**
   * The event name, for example 'mutation.createUser.AFTER'
   */
  event: string;

  /**
   * The input arguments of the resolver
   */
  args: TArgs;

  /**
   * The data that is loaded via the listener query on the mutation payload
   */
  data: TData;
}

export interface BeforeMutationListenerPayload<
  TArgs = {[name: string]: any}
> {
  /**
   * The event name, for example 'mutation.createUser.AFTER'
   */
  event: string;

  /**
   * The input arguments of the resolver
   */
  args: TArgs;
}

/**
 * The payload that is passed to resolvers
 */
export interface ResolverPayload<TArgs = {[name: string]: any}, TSource = any> {
  /**
   * The resolver event, for example 'resolve.Query.MyModule_fieldName'
   */
  event: string;

  /**
   * The input arguments of the resolver
   */
  args: TArgs;

  /**
   * The source object of the parent node. This contains the internal data,
   * so external resolved values might differ, for example for global IDs.
   */
  source: TSource;
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

export interface ResolvedGlobalId {
  /**
   * The internal ID as stored in the database
   */
  id: string;

  /**
   * The GraphQL type name
   */
  __typename: string;
}

export type Base64String = string;
