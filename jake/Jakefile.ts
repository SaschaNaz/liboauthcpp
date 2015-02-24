/// <reference path="ts-definitions/node-0.10.d.ts" />
/// <reference path="ts-definitions/jake.d.ts" />

var cc = "emcc";
var flags = "-O2 --memory-init-file 0 -std=c++11 -I ../include";
var sourceDirectory = "../src";
var subcomponents = ["base64", "HMAC_SHA1", "SHA1", "urlencode"];
var lib = "liboauthcpp";
function subcomponentFiles(fileExtension: string) {
  return subcomponents.map((item) => `${item}.${fileExtension}`);
}

function nodeBtoa(input: string) {
  return new Buffer('' + input, 'binary').toString("base64");
}

function definingCommand(definitions: { [key: string]: string }) {
  var subcommands: string[] = [];
  for (var key in definitions)
    subcommands.push(`-D ${key} ${definitions[key]}`);

  return subcommands.join(' ');
}

desc("Compiles subcomponents");
task("subcomponent", function () {
  subcomponentFiles("cpp").forEach((item) => {
    jake.exec([`${cc} ${flags} -c ${sourceDirectory}/${item}`], { printStdout: true, printStderr: true });
  });
});

desc("Compiles liboauthcpp.cpp");
task("lib", function (params) {
  if (!params || params.length < 1 || !("key" in params[0] && "secret" in params[0])) {
    console.error("Please give consumer_key and consumer_secret as a key-value object. ( key: YOURKEY, secret: YOURSECRET, [buildNonce: NONCE] ) Aborting building process...");
    return;
  }

  console.log("Jake received key and secret");

  var definitions: { [key: string]: string } = { CONSUMER_KEY: params.key, CONSUMER_SECRET: params.secret };
  if ("buildNonce" in params) {
    definitions["BUILD_NONCE"] = nodeBtoa(Math.random().toString());
  }
  else {
    console.log("No buildNonce parameter is detected. Tokens will be untouched.");
  }
  
  jake.exec([`${cc} ${flags} -c ${sourceDirectory}/${item} ${definingCommand(definitions)}`], { printStdout: true, printStderr: true });
  //jake.exec([cc + ' ' + flags + " -c " + sourceDirectory + '/])
});

desc("Builds a JavaScript OAuth component.");
task("default", ["subcomponent"], function (params) {
  (<jake.Task>(<any>jake.Task)["lib"]).invoke(...params);
  
  jake.exec([`${cc} ${flags} -o liboauthcpp.js ${subcomponentFiles("o").join(' ')}`], { printStdout: true, printStderr: true }, function () {
    console.log("liboauthcpp is built successfully.")
  })
});