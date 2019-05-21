const dotenv       = require('dotenv').config();
const express      = require('express');
const app          = express();
const crypto       = require('crypto');
const cookie       = require('cookie');
const nonce        = require('nonce');
const querystring  = require('querystring');
const request      = require('request-promise');
const ShopifyToken = require('shopify-token');

const apiKey            = process.env.SHOPIFY_API_KEY;
const apiSecret         = process.env.SHOPIFY_API_SECRET;
const scopes            = 'write_products';
const forwardingAddress = 'https://8bdb04a1.ngrok.io';

const shopifyToken = new ShopifyToken({
    apiKey       : apiKey,
    sharedSecret : apiSecret,
    redirectUri  : forwardingAddress+'/shopify/callback'
})

app.get('/welcome', (req, res) => {
    return res.status(200).send('Welcome page!');
});

app.get('/shopify', (req, res) => {
    const shop = req.query.shop;
    if(shop)
    {
      const shopRegex   = /^([\w-]+)\.myshopify\.com/i
      const shopName    = shopRegex.exec(shop)[1]
      const state       = shopifyToken.generateNonce();
      const redirectUri = forwardingAddress+'/shopify/callback';

      const url = shopifyToken.generateAuthUrl(shopName, scopes, state);
      res.cookie('state', state);
      res.redirect(url);
    }
    else
    {
      return res.status(400).send('missing shop parameter. Please add ?shop=your-shop.myshopify.com to your request');
    }
});

app.get('/shopify/callback', (req, res) => {

   const { shop, hmac, code, state } = req.query;
   const stateCookie = cookie.parse(req.headers.cookie).state;

   if(state !== stateCookie)
   {
      return res.status(403).send('Request origin cannot be verified');
   }

   if(shop && hmac && code)
   {
      const map = Object.assign({}, req.query);
      delete map['hmac'];
      const message = querystring.stringify(map);
      const generatedHash = crypto
          .createHmac('sha256', apiSecret)
          .update(message)
          .digest('hex');

      if(generatedHash !== hmac)
      {
         return res.status(400).send('HMAC Validation failed!');
      }
      else
      {
         const accessTokenRequestUrl = 'https://'+shop+'/admin/oauth/access_token';
         const accessTokenPayload = {
            client_id     : apiKey,
            client_secret : apiSecret,
            code
         };

         request.post(accessTokenRequestUrl, {json : accessTokenPayload})
             .then((accessTokenResponse) => {
                const accessToken = accessTokenResponse.access_token;

                const apiRequestUrl = 'https://'+shop+'/admin/products.json';
                const shopRequestHeader = {
                   'X-Shopify-Access-Token': accessToken
                };

                request.get(apiRequestUrl, {headers : shopRequestHeader})
                    .then((apiResponse) => {
                        res.end(apiResponse);
                    })
                    .catch((error) => {
                       res.status(error.statusCode).send(error.error_description);
                    })
             })
             .catch((error) => {
                res.status(error.statusCode).send(error.error_description);
             })
      }
   }
   else
   {
       return res.status(400).send('Required parameters missing!');
   }
});

app.listen(3000, () => {
   console.log('Example app listening on port 3000');
});