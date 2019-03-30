#!/usr/bin/env node
const { prompt } = require("enquirer");
const program = require("commander");
const fetch = require("node-fetch");

const BASE_URL = "https://api.cloudflare.com/client/v4/accounts";
const NAMESPACES_API = "storage/kv/namespaces";

function getHeaders(email, authKey) {
  return {
    "X-Auth-Email": email,
    "X-Auth-Key": authKey,
    "Content-Type": "application/json"
  };
}

async function getNamespaces({ accountId, authEmail, authKey }) {
  const url = `${BASE_URL}/${accountId}/${NAMESPACES_API}`;
  const resp = await fetch(url, { headers: getHeaders(authEmail, authKey) });
  const namespaces = await resp.json();
  return namespaces.result;
}

async function getKeys({ accountId, authEmail, authKey }, namespace) {
  const url = `${BASE_URL}/${accountId}/${NAMESPACES_API}/${namespace}/keys`;
  const resp = await fetch(url, { headers: getHeaders(authEmail, authKey) });
  const keys = await resp.json();
  return keys.result;
}

async function getKey({ accountId, authEmail, authKey }, namespace, key) {
  const url = `${BASE_URL}/${accountId}/${NAMESPACES_API}/${namespace}/values/${key}`;
  const resp = await fetch(url, { headers: getHeaders(authEmail, authKey) });
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
  program
    .option("--account-id <id>", "Cloudflare Account ID")
    .option("--account-email <email>", "Cloudflare Auth Email")
    .option("--account-key <key>", "Cloudflare Auth Key")
    .option("-n, --namespace", "Namespace")
    .option("-k, --key", "Key to get")
    .parse(process.argv);

  const accountId = program.account_id || process.env.CLOUDFLARE_ACCOUNT_ID;
  if (!accountId) {
    console.log("CLOUDFLARE_ACCOUNT_ID is required!");
    process.exit(1);
  }
  const authEmail = program.email || process.env.CLOUDFLARE_AUTH_EMAIL;
  if (!authEmail) {
    console.log("CLOUDFLARE_AUTH_EMAIL is required!");
    process.exit(1);
  }
  const authKey = program.key || process.env.CLOUDFLARE_AUTH_KEY;
  if (!authKey) {
    console.log("CLOUDFLARE_AUTH_KEY is required!");
    process.exit(1);
  }

  const accountVars = { accountId, authEmail, authKey };

  const namespaces = await getNamespaces(accountVars);
  const ns = await pickNamespace(namespaces);
  const keys = await getKeys(accountVars, ns.id);
  const key = await pickKey(keys);
  const val = await getKey(accountVars, ns.id, key);
  console.log(JSON.stringify(val, undefined, 2));
}
main().catch(e => console.log(e));
