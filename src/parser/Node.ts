import {ADT} from '../adt/adt'
import {TokenKind} from './Token'

export type Expr = ADT<{
    Var: string
    BoolLit: ADT<{True: null, False: null}>
    NumLit: number
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
}>;
