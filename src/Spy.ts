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

export class Spy<T extends Record<string, unknown>> {
	public callRecords = new Map<string, unknown[][]>();

	public getMock(objectToMock: T, callThrough: boolean = true, mocks: Partial<T> = {}): T {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const spy = this;
		return new Proxy<T>(objectToMock, {
			get(target: T, propertyKey: string, _receiver: unknown): unknown {
				const original = target[propertyKey];
				const mock = mocks[propertyKey];
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
		return function (this: T, ...args: unknown[]): unknown {
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

	public getCallCount(methodName: keyof T): number {
		const calls = this.callRecords.get(methodName as string);
		return calls?.length ?? 0;
	}

	public getArguments(methodName: keyof T): unknown[][] | undefined;
	public getArguments(methodName: keyof T, callIndex: number): unknown[] | undefined;
	public getArguments(methodName: keyof T, callIndex?: number): unknown[][] | unknown[] | undefined {
		const calls = this.callRecords.get(methodName as string);
		if (calls === undefined) { return undefined; }
		if (callIndex !== null && callIndex !== undefined) { return calls[callIndex]; }
		return calls;
	}

	public isCalled(methodName: keyof T, times?: number): void {
		const callCount = this.getCallCount(methodName);
		if (times) {
			assert.strictEqual(callCount, times, `expected calls mismatch for ${methodName}`);
		} else {
			assert.isAbove(callCount, 0, `expected ${methodName} to have been called at least once, but wasn't`);
		}
	}

	public isCalledWith(methodName: keyof T, expectedArgs: unknown, callIndex?: number, argsTransformer: ArgumentTransformer = identity): void {
		const actual = argsTransformer(this.getArguments(methodName, callIndex!));
		assert.deepStrictEqual(actual, expectedArgs, `expected argument mismatch for ${methodName}`);
	}

	private isFunction(arg: unknown): arg is Function {
		return typeof arg === 'function'
	}
}

export class SpiedProxy<T extends Record<string, unknown>> {
	public constructor(
		public spy: Spy<T>,
		public mockedObject: T
	) { }
}
export function createSpy<T extends Record<string, unknown>, K extends keyof T>(objectToMock: T, methodName: K, callThrough: boolean, mockImplementation?: T[K]): SpiedProxy<T>;
export function createSpy<T extends Record<string, unknown>>(objectToMock: T, callThrough: boolean, mockImplementation?: Partial<T>): SpiedProxy<T>;
export function createSpy<T extends Record<string, unknown>, K extends keyof T>(objectToMock: T, ...args: unknown[]): SpiedProxy<T> {
	let methodName: K;
	let callThrough: boolean;
	let mockImplementation: Partial<T> = {};

	switch (args.length) {
		case 3: {
			let methodImpl: T[K];
			[methodName, callThrough, methodImpl] = args as [K, boolean, T[K]];
			mockImplementation = { [methodName]: methodImpl } as unknown as Partial<T>;
			break;
		}
		case 2: {
			const [arg1, arg2] = args as [boolean, Partial<T>];
			if (typeof arg1 === 'string' && typeof arg2 === 'boolean') {
				methodName = arg1 as K;
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

	const spy = new Spy<T>();
	return new SpiedProxy(spy, spy.getMock(objectToMock, callThrough, mockImplementation));
}
