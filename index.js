const { prompt } = require("enquirer");
const fetch = require("node-fetch");

const BASE_URL = "https://api.cloudflare.com/client/v4/accounts";
const NAMESPACES_API = "storage/kv/namespaces";
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_AUTH_EMAIL = process.env.CLOUDFLARE_AUTH_EMAIL;
const CLOUDFLARE_AUTH_KEY = process.env.CLOUDFLARE_AUTH_KEY;

const headers = {
  "X-Auth-Email": CLOUDFLARE_AUTH_EMAIL,
  "X-Auth-Key": CLOUDFLARE_AUTH_KEY,
  "Content-Type": "application/json"
};

async function getNamespaces() {
  const url = `${BASE_URL}/${CLOUDFLARE_ACCOUNT_ID}/${NAMESPACES_API}`;
  const resp = await fetch(url, { headers: headers });
  const namespaces = await resp.json();
  return namespaces.result;
}

async function getKeys(namespace) {
  const url = `${BASE_URL}/${CLOUDFLARE_ACCOUNT_ID}/${NAMESPACES_API}/${namespace}/keys`;
  const resp = await fetch(url, { headers: headers });
  const keys = await resp.json();
  return keys.result;
}

async function getKey(namespace, key) {
  const url = `${BASE_URL}/${CLOUDFLARE_ACCOUNT_ID}/${NAMESPACES_API}/${namespace}/values/${key}`;
  const resp = await fetch(url, { headers: headers });
  const body = await resp.json();
  return body;
}

async function pickNamespace(namespaces) {
  const question = {
    type: "autocomplete",
    name: "namespace",
    message: "Namespace?",
    limit: 10,
    suggest(input, choices) {
      return choices.filter(choice => choice.message.includes(input));
    },
    choices: namespaces.map(ns => ns.title)
  };
  const resp = await prompt(question);
  const chosenNS = namespaces.filter(ns => ns.title === resp.namespace);
  return chosenNS ? chosenNS[0] : null;
}

async function pickKey(keys) {
  const question = {
    type: "autocomplete",
    name: "key",
    message: "Key?",
    limit: 10,
    suggest(input, choices) {
      return choices.filter(choice => choice.message.includes(input));
    },
    choices: keys.map(key => key.name)
  };
  const resp = await prompt(question);
  return resp.key;
}

async function main() {
  const namespaces = await getNamespaces();
  const ns = await pickNamespace(namespaces);
  const keys = await getKeys(ns.id);
  const key = await pickKey(keys);
  const val = await getKey(ns.id, key);
  console.log(JSON.stringify(val, undefined, 2));
}
main();
