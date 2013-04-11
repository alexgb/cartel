
build: client
	node_modules/.bin/browserify client/cartel-client/index.js | node_modules/.bin/uglifyjs - -o client/cartel-client.js

build-dev: client
	node_modules/.bin/browserify client/cartel-client/index.js > client/cartel-client.js

test:
	@NODE_ENV=test node_modules/.bin/mocha test/**

test-w:
	@NODE_ENV=test ./node_modules/.bin/mocha test/** \
		--growl \
		--watch

.PHONY: test test-w
