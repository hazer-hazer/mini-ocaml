import {MakeADT} from '../adt/adt'
import {Token, Span, TokenKind} from './Token'

export type Attr = {
    name: Token
    args: Token[]
}

export type Expr = MakeADT<'kind', {
    Var: {
        tok: Token
    }
    BoolLit: {
        val: Token
    }
    IntLit: {
        tok: Token
    }
    CharLit: {
        tok: Token
    }
    StringLit: {
        tok: Token
    }
    Let: {
        name: Token
        val: Expr
        body: Expr
    }
    LetRec: {
        func: Token
        name: Token
        val: Expr
        body: Expr
    }
    Func: {
        param: Token
        body: Expr
    }
    App: {
        lhs: Expr
        arg: Expr
    }
    Match: {
        subj: Expr
        with: [Expr, Expr][]
    }
    List: {
        elements: Expr[]
    }
    Infix: {
        lhs: Expr
        op: Token
        rhs: Expr
    }
    Prefix: {
        op: Token
        rhs: Expr
    }
    If: {
        cond: Expr
        ifBranch: Expr
        elseBranch: Expr | null
    }
    Tuple: {
        elements: Expr[]
    }
    Paren: {
        expr: Expr
    }
    // eslint-disable-next-line @typescript-eslint/ban-types
    Unit: {}
}> & {
    span: Span
    attrs?: Attr[]
};

export const astToString = (n: Expr, precDebug = true): string => {
    let str = ''

    if (precDebug) {
        str += '('
    }

    switch (n.kind) {
    case 'Let': {
        str += `let ${n.name} = ${astToString(n.val)} in ${astToString(n.body)}`
        break
    }
    case 'Var': {
        str += n.tok.val
        break
    }
    case 'BoolLit': {
        str += n.val.kind === TokenKind.True ? 'true' : 'false'
        break
    }
    case 'IntLit': {
        str += n.tok.val
        break
    }
    case 'Func': {
        str += `func ${n.param} -> ${astToString(n.body)}`
        break
    }
    case 'App': {
        str += `${astToString(n.lhs)} ${astToString(n.arg)}`
        break
    }
    case 'If': {
        str += `if ${astToString(n.cond)}\n  then ${astToString(n.ifBranch)}\n  else ${astToString(n.elseBranch!)}`
        break
    }
    case 'Infix': {
        str += `${astToString(n.lhs)} ${Token.kindStr(n.op.kind)} ${astToString(n.rhs)}`
        break
    }
    case 'List': {
        str += `[${n.elements.map(el => astToString(el)).join(', ')}]`
        break
    }
    case 'Prefix': {
        str += `${Token.kindStr(n.op.kind)}${astToString(n.rhs)}`
        break
    }
    case 'Match': {
        str += `match ${astToString(n.subj)} with\n |${n.with.map(el => `${astToString(el[0])} -> ${astToString(el[1])}`).join('\n| ')}`
        break
    }
    case 'LetRec': {
        str += `let rec ${n.func} ${n.name} = ${astToString(n.val)} in ${astToString(n.body)}`
        break
    }
    case 'Paren': {
        str += `(${astToString(n.expr)})`
        break
    }
    case 'Tuple': {
        str += `(${n.elements.map(el => astToString(el)).join(', ')})`
        break
    }
    case 'Unit': {
        str += '()'
        break
    }
    }

    if (precDebug) {
        str += ')'
    }

    return str
}
