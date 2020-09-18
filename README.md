# @netatwork/mocha-utils

[![npm version](https://img.shields.io/npm/v/@netatwork/mocha-utils)](https://www.npmjs.com/package/@netatwork/mocha-utils)
[![npm download](https://img.shields.io/npm/dt/@netatwork/mocha-utils?label=npm%20download)](https://www.npmjs.com/package/@netatwork/mocha-utils)
![build status](https://github.com/Netatwork-de/mocha-utils/workflows/build/badge.svg)

A bunch of utilities to be used for a mocha-based test setup.

## Reporters

This packages offers 2 different kinds of reporters.

### `JunitSpecReporter`

This meant to be used directly with Mocha.
If you are already familiar with Mocha, then you may know that Mocha does not support multiple reporters out of the box.
This reporter simply combines the [`mocha-junit-reporter`](https://www.npmjs.com/package/mocha-junit-reporter) with the Mocha [spec reporter](https://mochajs.org/#spec).
The goal is to facilitate generation of the JUnit report at the end of test, as well as have the result printed on the terminal.

**Usage**

```js
// .mocharc.js

module.exports = {
    reporter: '@netatwork/mocha-utils/dist/JunitSpecReporter.js',
    // Optionally you can also provide the options for every reporters.
	reporterOptions: {
        // Optional: provide the path for the generated JUnit report
		mochaFile: './tests/.artifacts/results.xml'
	},
};
```

### Karma-mocha HTML reporter

This is a similar reporter like [`karma-jasmine-html-reporter`](https://www.npmjs.com/package/karma-jasmine-html-reporter), meant to be used in a karma-mocha-based setup.

**Usage**

```js
const isDev = !!process.env.DEV;
const reporters = [...];

// this is a dev-only reporter
if (isDev) {
    reporters.push("kmhtml");
}

module.exports = function(config) {
    config.set({
        frameworks: ['mocha'],
        plugins: [
            // allows karma to load the conventional plugins
            "karma-*",
            // add the custom reporter itself.
            require("@netatwork/mocha-utils/dist/karma-html-reporter/index"),
        ],

        client: {
            clearContext: false,
        },

        reporters,
    })
};
```

## Spec wrapper

This utility function provides an alternative of using the `beforeEach`, and `afterEach` hooks.
The idea is to have a wrapper function that sets up the environment for the test, calls the test functions (this is where the assertions are), and after the test also performs the cleanup.
This pattern is based on the principle of increasing isolation between tests, and reduce the usage of shared state.
In fact eslint has a [rule](https://github.com/lo1tuma/eslint-plugin-mocha/blob/master/docs/rules/no-hooks.md) for this.

**Usage**

```typescript
import { createSpecFunction, TestContext, TestFunction } from '@netatwork/mocha-utils';

describe('example', function () {
  interface TestSetupContext {
    propA: boolean;
  }

  // Wrapper function
  async function runTest(
    testFunction: TestFunction<TestContext<SystemUnderTest>>,
    { propA = false }: Partial<TestSetupContext> = {}
  ) {
    // arrange/setup as per the options provided via TestSetupContext
    const sut = new SystemUnderTest(propA);

    // act and Assert
    await testFunction({ sut });

    // cleanup
    sut.dispose();
  }

  // Create the wrapped `it`
  const $it = createSpecFunction(runTest);

  $it('works#1', function ({ sut }) {
    assert.strictEqual(sut?.doSomething(), false);
  });

  $it('works#2', function ({ sut }) {
    assert.strictEqual(sut?.doSomething(), true);
  }, { propA: true });
}

class SystemUnderTest {

  public constructor(
    private readonly propA: boolean,
  ) { }

  public doSomething() {
    return this.propA;
  }

  public dispose() {
    //...
  }
}
```

## Alternative Spy implementation

This package also provides an alternative Spy implementation.
The spy is relatively small and provides simple API.

```typescript
import { createSpy, Spy } from '@netatwork/mocha-utils';

class Service {
    public getData(): Promise<any> {
        // here we make HTTP requests
    }
}

class Sut {
    public constructor(
        public readonly service: Service
    ) { }
}

const { mockedObject: service, spy: serviceSpy } = createSpy(
    /* object to mock       */ new Service(),
    /* call through         */ false,
    /* mock implementations */ {
        getData() {
            return Promise.resolve([]);
        }
    }
);

const sut = new Sut(service);
await sut.service.getData();
// assert method call
serviceSpy.isCalled('getData');
```
