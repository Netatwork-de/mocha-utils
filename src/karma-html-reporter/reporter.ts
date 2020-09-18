import { reporters, Runner, Test } from 'mocha';

const {
    EVENT_RUN_END,
    EVENT_SUITE_BEGIN,
    EVENT_SUITE_END,
    EVENT_TEST_FAIL,
    EVENT_TEST_PASS,
    EVENT_TEST_PENDING,
} = Runner.constants;

class MyReporter {
    /** @internal */
    public static OriginalReporterFunction: typeof reporters.Base;
    private readonly originalReporter: reporters.Base;
    private dots!: HTMLDivElement;
    private specs!: HTMLUListElement;

    constructor(runner: Runner) {
        // this will retain the original reporter functionality as well.
        this.originalReporter = new MyReporter.OriginalReporterFunction(runner);
        const container = this.createResultContainer();
        if (container === null) { return; }

        let currentSuiteContainer = this.specs;

        runner
            .on(EVENT_SUITE_BEGIN, (suite) => {
                if (suite.root) { return; }
                const title = suite.title;
                const item = this.createListItem(title);
                const list = document.createElement('ul');
                item.appendChild(list);
                currentSuiteContainer.appendChild(item);
                currentSuiteContainer = list;
            })
            .on(EVENT_SUITE_END, () => {
                currentSuiteContainer = currentSuiteContainer.parentElement! as HTMLUListElement;
            })
            .on(EVENT_TEST_PASS, (test) => {
                this.append(test, EVENT_TEST_PASS, currentSuiteContainer);
            })
            .on(EVENT_TEST_PENDING, (test) => {
                this.append(test, EVENT_TEST_PENDING, currentSuiteContainer);
            })
            .on(EVENT_TEST_FAIL, (test) => {
                this.append(test, EVENT_TEST_FAIL, currentSuiteContainer);
            })
            .once(EVENT_RUN_END, () => {
                container.appendChild(this.specs);
            });
    }

    public createResultContainer(): HTMLDivElement | null {
        try {
            const container = document.createElement('div');
            container.classList.add('kmhtml');
            const dots = this.dots = document.createElement('div');
            this.specs = document.createElement('ul');
            container.appendChild(dots);
            document.body.appendChild(container);
            return container;
        } catch (e) {
            return null;
        }
    }

    public append(
        test: Test,
        status: string,
        suiteContainer: HTMLUListElement,
    ): void {
        let $class: string = '';
        switch (status) {
            case EVENT_TEST_PASS:
                $class = 'passed';
                break;
            case EVENT_TEST_FAIL:
                $class = 'failed';
                break;
            case EVENT_TEST_PENDING:
                $class = 'pending';
                break;
        }

        const title = test.fullTitle();
        const span = document.createElement('span');
        span.innerHTML = '&bull;';
        span.title = title;
        span.classList.add($class);
        span.style.color = $class;

        this.dots.appendChild(span);
        suiteContainer.appendChild(this.createListItem(test.title, title, $class));
    }

    public createListItem(
        title: string,
        fullTitle = title,
        $class = '',
    ): HTMLLIElement {
        const li = document.createElement('li');
        if ($class) {
            li.classList.add($class);
        }

        const anchor = document.createElement('a');
        anchor.innerText = title;
        const loc = new URL(location.href);
        loc.pathname = 'debug.html';
        loc.searchParams.set('grep', fullTitle);
        anchor.href = loc.href;
        anchor.target = '_blank';

        li.appendChild(anchor);

        return li;
    }
}
declare const window: Window & { mocha: Mocha };
try {
    const mocha: Mocha = window.mocha;
    [MyReporter.OriginalReporterFunction, mocha['_reporter']] = [mocha['_reporter'], MyReporter];
} catch (e) {
    console.log('Not running the kmhtml reporter. Note that this is a dev-only reporter, meant to be used in browser.');
}