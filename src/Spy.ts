/*! ********************************************************************************
 * Disclaimer:
 * This is implementation of Spy is influenced from Aurelia2's Spy implementation
 * for internal usage.
 * Refer: https://github.com/aurelia/aurelia/blob/master/packages/__tests__/Spy.ts
 ******************************************************************************** */

import { assert } from 'chai'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ArgumentTransformer = (args: any) => any;
const identity: ArgumentTransformer = (_) => _;

const noop: () => void = () => { /* noop */ };
export type MethodNames<TObject> = { [Method in keyof TObject]: TObject[Method] extends Function ? Method : never }[keyof TObject];
export type PickOnlyMethods<TObject> = { [Method in MethodNames<TObject>]: TObject[Method] };
export type MethodParameters<TObject, TMethod extends MethodNames<TObject>> = Parameters<PickOnlyMethods<TObject>[TMethod]>;

export class Spy<TObject extends object> {
	public callRecords = new Map<string, unknown[][]>();

	public getMock(objectToMock: TObject, callThrough: boolean = true, mocks: Partial<TObject> = {}): TObject {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const spy = this;
		return new Proxy<TObject>(objectToMock, {
			get(target: TObject, propertyKey: string, _receiver: unknown): unknown {
				const original = (target as Record<string, unknown>)[propertyKey];
				const mock = (mocks as Record<string, unknown>)[propertyKey];
				if (spy.isFunction(original)) {
					if (spy.isFunction(mock)) {
						return spy.createCallRecorder(propertyKey, mock);
					}
					return callThrough
						? spy.createCallRecorder(propertyKey, original)
						: spy.createCallRecorder(propertyKey, noop)
				}
				return mock ?? (callThrough ? original : undefined);
			}
		});
	}

	public createCallRecorder(propertyKey: string, trapped: Function): Function {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const spy = this;
		return function (this: TObject, ...args: unknown[]): unknown {
			spy.setCallRecord(propertyKey, args);
			return trapped.apply(this, args);
		}
	}

	public setCallRecord(methodName: string, args: unknown[]): void {
		let record = this.callRecords.get(methodName);
		if (record) {
			record.push(args);
		} else {
			record = [args];
		}
		this.callRecords.set(methodName, record);
	}

	public clearCallRecords(): void { this.callRecords.clear(); }

	public getCallCount(methodName: MethodNames<TObject>): number {
		const calls = this.callRecords.get(methodName as string);
		return calls?.length ?? 0;
	}

	public getArguments<TMethod extends MethodNames<TObject>>(methodName: TMethod): MethodParameters<TObject, TMethod>[] | undefined;
	public getArguments<TMethod extends MethodNames<TObject>>(methodName: TMethod, callIndex: number): MethodParameters<TObject, TMethod> | undefined;
	public getArguments<TMethod extends MethodNames<TObject>>(methodName: TMethod, callIndex?: number): MethodParameters<TObject, TMethod>[] | unknown[] | undefined {
		const calls = this.callRecords.get(methodName as string);
		if (calls === undefined) { return undefined; }
		if (callIndex !== null && callIndex !== undefined) { return calls[callIndex]; }
		return calls;
	}

	public isCalled(methodName: MethodNames<TObject>, times?: number): void {
		const callCount = this.getCallCount(methodName);
		if (times) {
			assert.strictEqual(callCount, times, `expected calls mismatch for ${methodName}`);
		} else {
			assert.isAbove(callCount, 0, `expected ${methodName} to have been called at least once, but wasn't`);
		}
	}

	public isCalledWith(methodName: MethodNames<TObject>, expectedArgs: unknown, callIndex?: number, argsTransformer: ArgumentTransformer = identity): void {
		const actual = argsTransformer(this.getArguments(methodName, callIndex!));
		assert.deepStrictEqual(actual, expectedArgs, `expected argument mismatch for ${methodName}`);
	}

	private isFunction(arg: unknown): arg is Function {
		return typeof arg === 'function'
	}
}

export class SpiedProxy<TObject extends object> {
	public constructor(
		public spy: Spy<TObject>,
		public mockedObject: TObject
	) { }
}
export function createSpy<TObject extends object, TMethod extends MethodNames<TObject>>(objectToMock: TObject, methodName: TMethod, callThrough: boolean, mockImplementation?: TObject[TMethod]): SpiedProxy<TObject>;
export function createSpy<TObject extends object>(objectToMock: TObject, callThrough: boolean, mockImplementation?: Partial<TObject>): SpiedProxy<TObject>;
export function createSpy<TObject extends object, TMethod extends MethodNames<TObject>>(objectToMock: TObject, ...args: unknown[]): SpiedProxy<TObject> {
	let methodName: TMethod;
	let callThrough: boolean;
	let mockImplementation: Partial<TObject> = {};

	switch (args.length) {
		case 3: {
			let methodImpl: TObject[TMethod];
			[methodName, callThrough, methodImpl] = args as [TMethod, boolean, TObject[TMethod]];
			mockImplementation = { [methodName]: methodImpl } as unknown as Partial<TObject>;
			break;
		}
		case 2: {
			const [arg1, arg2] = args as [boolean, Partial<TObject>];
			if (typeof arg1 === 'string' && typeof arg2 === 'boolean') {
				methodName = arg1 as TMethod;
				callThrough = arg2;
			} else if (typeof arg1 === 'boolean') {
				callThrough = arg1;
				mockImplementation = arg2;
			} else {
				throw new Error(`unconsumed arguments: ${arg1}, ${arg2}`);
			}
			break;
		}
		case 1: {
			const arg1 = args[0];
			if (typeof arg1 !== 'boolean') { throw new Error(`unconsumed argument: ${arg1}`); }
			callThrough = arg1;
			break;
		}
		default:
			throw new Error('Unexpected number of arguments');
	}

	const spy = new Spy<TObject>();
	return new SpiedProxy(spy, spy.getMock(objectToMock, callThrough, mockImplementation));
}
