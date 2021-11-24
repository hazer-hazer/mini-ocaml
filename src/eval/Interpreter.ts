import { MakeADT } from '../adt/adt'
import { astToString, Expr } from '../parser/Node'
import {Span, Token, TokenKind} from '../parser/Token'
import {Source} from '../parser/Source'

export class Env {
    names: Record<string, Value>
    parent?: Env
}

export class AnonTagClass {}
const AnonTag = new AnonTagClass

export type Value = MakeADT<'type', {
    Unit: {}
    Int: {
        val: number
    }
    Bool: {
        val: boolean
    }
    List: {
        values: any[] // Cannot use `Value` as it causes cyclic reference issue
    }
    Tuple: {
        values: any[]
    }
    Closure: {
        name: string | AnonTagClass
        param: string
        body: Expr
        env: Env
    }
}>

export const envStr = (env: Env): string => {
    const mult = Object.keys(env).length > 1
    let str = '{' + (mult ? '\n' : '')
    for (const [name, val] of Object.entries(env)) {
        str += `${mult ? '  ' : ''}${name}: ${valueStr(val)}`
    }
    return str + (mult ? '\n' : '') + '}'
}

export const valueStr = (val: Value): string => {
    switch (val.type) {
    case 'Bool': {
        return val.val ? 'true' : 'false'
    }
    case 'Int': {
        return val.val.toString()
    }
    case 'List': {
        return `[${val.values.map(el => valueStr(el)).join(', ')}]`
    }
    case 'Closure': {
        return `${val.name === AnonTag ? `[rec-func] ${val.name}: ` : 'func'} ${val.param} -> ${astToString(val.body)} [env] ${envStr(val.env)}`
    }
    case 'Unit': {
        return '()'
    }
    case 'Tuple': {
        return `(${val.values.map(el => valueStr(el)).join(', ')})`
    }
    }
}

const extendEnv = (env: Env, name: string, val: Value) => ({...env, [name]: val})

export class Interpreter {
    envStack: Env[] = []
    source?: Source

    constructor(env: Env) {
        this.enterEnv(env)
    }

    private backEnv() {
        return this.envStack[this.envStack.length - 1]
    }

    private enterEnv(env: Env) {
        this.envStack.push(env)
    }

    private exitEnv() {
        this.envStack.pop()
    }

    public interpretTopLevel(expr: Expr, source: Source): Value {
        this.source = source
        return this.interpret(expr)
    }

    private interpret(expr: Expr): Value {
        switch (expr.kind) {
        case 'Let': {
            this.enterEnv(extendEnv(this.backEnv(), expr.name, this.interpret(expr.val)))

            const result = this.interpret(expr.body)

            this.exitEnv()

            return result
        }
        case 'Var': {
            return this.lookup(expr.tok)
        }
        case 'BoolLit': {
            return {type: 'Bool', val: expr.True}
        }
        case 'IntLit': {
            return {type: 'Int', val: Number(expr.tok.val)}
        }
        case 'Func': {
            return {type: 'Closure', name: AnonTag, param: expr.param, body: expr.body, env: this.backEnv()}
        }
        case 'App': {
            const lhs = this.interpret(expr.lhs)
            if (lhs.type !== 'Closure') {
                throw new Error('Expected function on left-hand side, got ' + valueStr(lhs))
            }
            const arg = this.interpret(expr.arg)

            this.enterEnv(extendEnv(lhs.env, lhs.param, arg))

            const result = this.interpret(lhs.body)

            this.exitEnv()

            return result
        }
        case 'If': {
            const cond = this.interpret(expr.cond)
            if (cond.type !== 'Bool') {
                throw new Error('\'if\' condition must be of boolean type')
            }
            if (cond.val) {
                return this.interpret(expr.ifBranch)
            } else {
                return this.interpret(expr.elseBranch!)
            }
        }
        case 'Infix': {
            const lhs = this.interpret(expr.lhs)
            const rhs = this.interpret(expr.rhs)

            switch (expr.op.kind) {
            case TokenKind.Plus: {
                return {type: 'Int', val: this.toInt(lhs, expr.lhs.span) + this.toInt(rhs, expr.rhs.span)}
            }
            case TokenKind.Minus: {
                return {type: 'Int', val: this.toInt(lhs, expr.lhs.span) - this.toInt(rhs, expr.rhs.span)}
            }
            case TokenKind.Mul: {
                return {type: 'Int', val: this.toInt(lhs, expr.lhs.span) * this.toInt(rhs, expr.rhs.span)}
            }
            case TokenKind.Div: {
                return {type: 'Int', val: this.toInt(lhs, expr.lhs.span) * this.toInt(rhs, expr.rhs.span)}
            }
            case TokenKind.Eq: {
                return {type: 'Bool', val: this.compareValues(lhs, rhs, expr.lhs.span, expr.rhs.span)}
                // return {type: 'Int', val: this.toInt(lhs, expr.lhs.span) - this.toInt(rhs, expr.rhs.span)}
            }
            case TokenKind.ColCol: {
                if (rhs.type !== 'List') {
                    this.error('Right-hand side of :: operator must be of list type', expr.op.span)
                }
                return {type: 'List', values: [lhs, ...rhs.values]}
            }
            }

            this.error(`Invalid infix operator ${Token.kindStr(expr.op.kind)}`, expr.op.span)
            break
        }
        case 'Tuple': {
            const values = []
            for (const el of expr.elements) {
                values.push(this.interpret(el))
            }
            return {type: 'Tuple', values}
        }
        case 'Paren': {
            return this.interpret(expr.expr)
        }
        case 'Unit': {
            return {type: 'Unit'}
        }
        case 'LetRec': {
            const func: Value = {type: 'Closure', name: expr.func, body: expr.val, param: expr.name, env: this.backEnv()}

            this.enterEnv(extendEnv(this.backEnv(), expr.func, func))

            const val = this.interpret(expr.body)

            this.exitEnv()

            return val
        }
        case 'Match': {
            throw new Error('Not implemented')
        }
        case 'List': {
            const values = []
            for (const el of expr.elements) {
                values.push(this.interpret(el))
            }
            return {type: 'List', values}
        }
        case 'Prefix': {
            const rhs = this.interpret(expr.rhs)
            switch (expr.op.kind) {
            case TokenKind.Minus: {
                return {type: 'Int', val: -this.toInt(rhs, expr.rhs.span)}
            }
            case TokenKind.Head: {
                if (rhs.type !== 'List') {
                    this.error('\'head\' operator requires list', expr.op.span)
                }
                return rhs.values[0]
            }
            case TokenKind.Tail: {
                if (rhs.type !== 'List') {
                    this.error('\'tail\' operator requires list', expr.op.span)
                }
                return {type: 'List', values: rhs.values.slice(1)}
            }
            }

            this.error(`Invalid prefix operator ${Token.kindStr(expr.op.kind)}`, expr.op.span)
            break
        }
        }
    }

    private lookup(name: Token): Value {
        let envIndex = this.envStack.length - 1
        let env = this.backEnv()

        while (env) {
            const val = env[name.val]

            if (val !== undefined) {
                return val
            }

            env = this.envStack[--envIndex]
        }

        this.error(`Cannot find variable ${name}`, name.span)
    }

    toInt(val: Value, span: Span): number {
        if (val.type !== 'Int') {
            this.error('Integer value expected', span)
        }
        return val.val
    }

    toBool(val: Value, span: Span): boolean {
        if (val.type !== 'Bool') {
            this.error('Expected boolean value', span)
        }
        return val.val
    }

    compareValues(lhs: Value, rhs: Value, lhsSpan: Span, rhsSpan: Span): boolean {
        if (lhs.type === 'Int') {
            return this.toInt(lhs, lhsSpan) === this.toInt(rhs, rhsSpan)
        }

        if (lhs.type === 'Bool') {
            return this.toBool(lhs, lhsSpan) === this.toBool(rhs, rhsSpan)
        }

        this.error('Unable to compare values, now only integer and boolean comparisons allowed', lhsSpan.to(rhsSpan))
    }

    private error(msg: string, span: Span): never {
        throw new Error(`${this.source?.getPointerLine(msg, span)}`)
    }
}
