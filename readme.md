# Installation Guide

Clone the repository into a local directory.

```bash
git clone git@github.com:dylanfa88/shopify-demo-app.git
```

cd into the **shopify-demo-app** folder Install the node modules, by running the following

```bash
npm install
```

rename the file .env_sample to .env

```bash
mv .env_sample .env
```

The shopify API key and secret can be found when you create a new app within shopify. The demo also uses **ngrok.io** to create a tunnel between a publicly available url and your local environment. 
Download the ngrok tool and run the following script to create a tunnel to localhost on port 3000, you can use any port of your choice.

```bash
./ngrok http 3000
```

Fill up the information in the .env file then run the script, and navigate to /shopify on your ngrok url.

```bash
node index.js
```

Based on the wonderful [tutorial](https://www.youtube.com/watch?v=D3iO4mZHgLk) by Andrew McCauley

