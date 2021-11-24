type IO<I, O> = {
    input: I
    output: O
}

class Result<T, E> {
    readonly isOk: boolean
    readonly inner: T | E

    constructor(isOk: boolean, inner: T | E) {
        this.isOk = isOk
        this.inner = inner
    }

    public err() {
        return !this.ok
    }

    public ok() {
        return this.ok
    }

    public unwrap(): T {
        if (!this.ok()) {
            throw new Error('Called `Result.unwrap` with Err value')
        }
        return this.inner as T
    }

    public unwrapErr(): E {
        if (this.ok()) {
            throw new Error('Called `Result.unwrapErr` with Ok value')
        }
        return this.inner as E
    }

    public or(other: Result<T, E>) {
        if (this.ok()) {
            return this
        }
        return other
    }

    public and<U>(other: Result<U, E>): Result<U, E> {
        if (this.ok()) {
            return other
        }

        return Err(this.inner as E)
    }

    public andThen<U>(other: (val: T) => Result<U, E>) {
        if (this.ok()) {
            return other(this.inner as T)
        }

        return Err(this.inner as E)
    }
}

type ParseResult<I, O, E> = Result<IO<I, O>, E>

const Ok = <T, E>(value: T): Result<T, E> => new Result<T, E>(true, value)
const Err = <T, E>(error: E): Result<T, E> => new Result<T, E>(false, error)

abstract class Parser<I, O, E> {
    public abstract parse(input: I): ParseResult<I, O, E>;
}

class Or<I, O, E> extends Parser<I, O, E> {
    lp: Parser<I, O, E>
    rp: Parser<I, O, E>

    constructor(lp: Parser<I, O, E>, rp: Parser<I, O, E>) {
        super()

        this.lp = lp
        this.rp = rp
    }

    public parse(input: I): ParseResult<I, O, E> {
        return this.lp.parse(input).or(this.rp.parse(input))
    }
}

class And<I, O1, O2, E> extends Parser<I, [O1, O2], E> {
    lp: Parser<I, O1, E>
    rp: Parser<I, O2, E>

    constructor(lp: Parser<I, O1, E>, rp: Parser<I, O2, E>) {
        super()

        this.lp = lp
        this.rp = rp
    }

    public parse(input: I): ParseResult<I, [O1, O2], E> {
        const lRes = this.lp.parse(input)

        if (lRes.err()) {
            return Err(lRes.unwrapErr())
        }

        const rRes = this.rp.parse(input)

        if (rRes.err()) {
            return Err(rRes.unwrapErr())
        }

        return Ok({input, output: [lRes.unwrap().output, rRes.unwrap().output]})
    }
}
