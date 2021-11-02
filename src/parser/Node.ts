import {ADT, MakeADT} from '../adt/adt'
import {TokenKind} from './Token'

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
        in: Expr
    }
    LetRec: {
        func: string
        name: string
        val: Expr
        in: Expr
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
    Cons: {
        lhs: Expr
        rhs: Expr
    }
    Head: {
        expr: Expr
    }
    Tail: {
        expr: Expr
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
}>;
