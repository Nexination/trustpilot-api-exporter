# Trustpilot API exporter
So far this program only supports exporting anything from the public API's, but should it become a hit, then OAuth will most likely be added at a later stage.

# Disclaimer aka Here be dragons!
This single page app runs no security measures, so exposing it to the internet means you WILL give access for anyone to manipulate your Trustpilot account. This is not only dangerous to your TrustScore, but also a breach of contract and liable to lawsuits. Use this software at your own discretion, I am not liable for any damages or lawsuits as a result of using this software.

## Data.json
This is the settings file and it will have to look something like this:
```
{
  "apiKey": "gobbledigoop", API key
  "apiSecret": "narfenblarble", // API secret, not yet used
  "dataFormat": "simple", // Simple or concatenated
  "businessUnit": "johnnybgood"
}
```
