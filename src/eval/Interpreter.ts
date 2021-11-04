import { MakeADT } from "../adt/adt"
import { Expr } from "../parser/Node"
import { TokenKind } from "../parser/Token"

export type Env = Record<string, Value>

export type Value = MakeADT<'type', {
    None: {}
    Int: {
        val: number
    }
    Bool: {
        val: boolean
    }
    List: {
        elements: any[] // Cannot use `Value` as it causes cyclic reference issue
    }
    Func: {
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

export const valueStr = (val: Value): string => {
    switch (val.type) {
    case 'Bool': {
        return val.val ? 'true' : 'false'
    }
    case 'Int': {
        return val.val.toString()
    }
    case 'List': {
        return `[${val.elements.map(el => valueStr(el)).join(', ')}]`
    }
    case 'Func': {
        return `<func ${val.param} -> ...>`
    }
    case 'None': {
        return '()'
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
            return {type: 'Func', param: expr.param, body: expr.body, env: this.backEnv()}
        }
        case 'App': {
            const lhs = this.interpret(expr.lhs)
            if (lhs.type !== 'Func') {
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
        }

        throw new Error(`Unhandled kind of expression '${expr.kind}'`)
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
        }

        throw new Error('Invalid infix operator')
    }
}
