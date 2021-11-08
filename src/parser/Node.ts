import {MakeADT} from '../adt/adt'
import {TokenKind, Token, Span} from './Token'

export type Expr = MakeADT<'kind', {
    Var: {
        tok: string
    }
    BoolLit: {
        True: boolean
    }
    IntLit: {
        tok: string
    }
    Let: {
        name: string
        val: Expr
        body: Expr
    }
    LetRec: {
        func: string
        name: string
        val: Expr
        body: Expr
    }
    Func: {
        param: string
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
        op: TokenKind
        rhs: Expr
    }
    Prefix: {
        op: TokenKind
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
    Unit: {}
}> & {
    span: Span,
};

export const astToString = (n: Expr): string => {
    switch (n.kind) {
    case 'Let': {
        return `let ${n.name} = ${astToString(n.val)} in ${astToString(n.body)}`
    }
    case 'Var': {
        return n.tok
    }
    case 'BoolLit': {
        return n.True ? 'true' : 'false'
    }
    case 'IntLit': {
        return n.tok
    }
    case 'Func': {
        return `func ${n.param} -> ${astToString(n.body)}`
    }
    case 'App': {
        return `${astToString(n.lhs)} ${astToString(n.arg)}`
    }
    case 'If': {
        return `if ${astToString(n.cond)}\n  then ${astToString(n.ifBranch)}\n  else ${astToString(n.elseBranch!)}`
    }
    case 'Infix': {
        return `${astToString(n.lhs)} ${Token.kindStr(n.op)} ${astToString(n.rhs)}`
    }
    case 'List': {
        return `[${n.elements.map(el => astToString(el)).join(', ')}]`
    }
    case 'Prefix': {
        return `${Token.kindStr(n.op)}${astToString(n.rhs)}`
    }
    case 'Match': {
        return `match ${astToString(n.subj)} with\n |${
            n.with.map(el => `${astToString(el[0])} -> ${astToString(el[1])}`).join('\n| ')
        }`
    }
    case 'LetRec': {
        return `let rec ${n.func} ${n.name} = ${astToString(n.val)} in ${astToString(n.body)}`
    }
    case 'Paren': {
        return `(${astToString(n.expr)})`
    }
    case 'Tuple': {
        return `(${n.elements.map(el => astToString(el)).join(', ')})`
    }
    case 'Unit': {
        return '()'
    }
    }
}
