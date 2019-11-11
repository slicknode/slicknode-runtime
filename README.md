# Slicknode Runtime

Lightweight zero dependency wrapper to process calls from Slicknode GraphQL servers to custom 
runtime handlers in NodeJS. 

**Features:**

-   Delegates Slicknode runtime requests to the corresponding javascript code
-   Validates request signatures and authentication
-   Handles errors
-   Formats responses to the format expected by the Slicknode GraphQL server

## Installation

    npm install slicknode-runtime
    
## Usage

```javascript
const {SlicknodeRuntime} = require('slicknode-runtime');

const runtime = new SlicknodeRuntime({
    // The secret key that requests are signed with by the Slicknode GraphQL server
    // Requests are rejected on mismatch
    // Defaults to process.env.SLICKNODE_SECRET
    // If none provided and SLICKNODE_SECRET env variable is not set, authentication is
    // skipped (insecure, for testing only)
    secret: 'somesecretkey',
    
    // Optional: The maximum allowed clockdrift in seconds for signature timestamps between the
    // two servers
    // Default: 120
    maxClockDrift: 30, 
});

// Register slicknode modules
runtime.register('@private/my-slicknode-module-id', 'commonjs-module-name');
// ...

// Execute by passing the request body (as string) and an object of the
// request headers. Then return as HTTP response...
//
// For express for example:
app.use(bodyParser.raw({
  type: 'application/json',
}));
app.post('/', async (req, res) => {
    const data = await runtime.execute(req.body.toString(), req.headers);
    return res.json(data);
});
```
