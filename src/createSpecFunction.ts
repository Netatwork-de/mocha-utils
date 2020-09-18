/*! ********************************************************************************
Disclaimer: 
This is influenced from internals of Aurelia2: https://github.com/aurelia/aurelia
******************************************************************************** */
export interface TestContext<TSut> {
	sut?: TSut;
}
export type TestFunction<TTestContext extends TestContext<any>> = (ctx: TTestContext) => void | Promise<void>;
export type WrapperFunction<TTestContext extends TestContext<any>, TSetupContext> = (testFunction: TestFunction<TTestContext>, setupContext?: TSetupContext) => void | Promise<void>;
export type TestRunner<
	TSetupContext,
	TTestContext extends TestContext<any>,
	> = (title: string, testFunction: (ctx: TTestContext) => void, setupContext?: TSetupContext) => void;

type spec<TTestContext extends TestContext<any>, TSetupContext> = (title: string, testFunction: TestFunction<TTestContext>, setupContext?: TSetupContext) => void
type $It<TTestContext extends TestContext<any>, TSetupContext> = spec<TTestContext, TSetupContext> & {
	only: spec<TTestContext, TSetupContext>;
	skip: spec<TTestContext, TSetupContext>;
};

export function createSpecFunction<TTestContext extends TestContext<any>, TSetupContext>(wrap: WrapperFunction<TTestContext, TSetupContext>): $It<TTestContext, TSetupContext> {

	function $it(title: string, testFunction: TestFunction<TTestContext>, setupContext?: TSetupContext): void {
		it(title, async function() { await wrap(testFunction, setupContext); });
	}

	$it.only = function(title: string, testFunction: TestFunction<TTestContext>, setupContext?: TSetupContext): void {
		it.only(title, async function() { await wrap(testFunction, setupContext); });
	};

	$it.skip = function(title: string, testFunction: TestFunction<TTestContext>, setupContext?: TSetupContext): void {
		it.skip(title, async function() { await wrap(testFunction, setupContext); });
	};

	return $it;
}
