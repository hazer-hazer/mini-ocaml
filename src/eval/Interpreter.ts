import { MakeADT } from "../adt/adt"
import { astToString, Expr } from "../parser/Node"
import { Token, TokenKind } from "../parser/Token"

export type Env = Record<string, Value>

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

const toInt = (val: Value): number => {
    if (val.type !== 'Int') {
        throw new Error('Integer value expected')
    }
    return val.val
}

const toBool = (val: Value): boolean => {
    if (val.type !== 'Bool') {
        throw new Error('Expected boolean value')
    }
    return val.val
}

const compareValues = (lhs: Value, rhs: Value): boolean => {
    if (lhs.type === 'Int') {
        return toInt(lhs) === toInt(rhs)
    }

    if (lhs.type === 'Bool') {
        return toBool(lhs) === toBool(rhs)
    }

    throw new Error('Unable to compare values, now only integer and boolean comparisons allowed')
}

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

    public interpret(expr: Expr): Value {
        switch (expr.kind) {
        case 'Let': {
            this.enterEnv(extendEnv(this.backEnv(), expr.name, this.interpret(expr.val)))

            const result = this.interpret(expr.body)

            this.exitEnv()

            return result
        }
        case 'Var': {
            return this.lookup(expr.tok, this.backEnv())
        }
        case 'BoolLit': {
            return {type: 'Bool', val: expr.True}
        }
        case 'IntLit': {
            return {type: 'Int', val: Number(expr.tok)}
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
                throw new Error(`'if' condition must be of boolean type`)
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
            return this.evalInfix(expr.op, lhs, rhs)
        }
        case 'Tuple': {
            let values = []
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
            throw new Error(`Not implemented`)
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
            return this.evalPrefix(expr.op, rhs)
        }
        }
    }

    private lookup(name: string, env: Env): Value {
        const val = env[name]

        if (!val) {
            throw new Error(`Cannot find variable ${name}`)
        }

        return val
    }

    private evalInfix(op: TokenKind, lhs: Value, rhs: Value): Value {
        switch (op) {
        case TokenKind.Plus: {
            return {type: 'Int', val: toInt(lhs) + toInt(rhs)}
        }
        case TokenKind.Minus: {
            return {type: 'Int', val: toInt(lhs) - toInt(rhs)}
        }
        case TokenKind.Mul: {
            return {type: 'Int', val: toInt(lhs) * toInt(rhs)}
        }
        case TokenKind.Div: {
            return {type: 'Int', val: toInt(lhs) * toInt(rhs)}
        }
        case TokenKind.Eq: {
            return {type: 'Bool', val: compareValues(lhs, rhs)}
            // return {type: 'Int', val: toInt(lhs) - toInt(rhs)}
        }
        case TokenKind.ColCol: {
            if (rhs.type !== 'List') {
                throw new Error('Right-hand side of :: operator must be of list type')
            }
            return {type: 'List', values: [lhs, ...rhs.values]}
        }
        }

        throw new Error(`Invalid infix operator ${Token.kindStr(op)}`)
    }

    private evalPrefix(op: TokenKind, rhs: Value): Value {
        switch (op) {
        case TokenKind.Minus: {
            return {type: 'Int', val: -toInt(rhs)}
        }
        case TokenKind.Head: {
            if (rhs.type !== 'List') {
                throw new Error(`'head' operator requires list`)
            }
            return rhs.values[0]
        }
        case TokenKind.Tail: {
            if (rhs.type !== 'List') {
                throw new Error(`'tail' operator requires list`)
            }
            return {type: 'List', values: rhs.values.slice(1)}
        }
        }

        throw new Error(`Invalid prefix operator ${Token.kindStr(op)}`)
    }
}
