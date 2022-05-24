import {Expr} from '../parser/Node'

type NonGen = Set<Type>

class Type {
    public get pruned(): Type {
        if (this instanceof TypeVar && this.instance) {
            return this.instance = this.instance.pruned
        }
        return this
    }
}

class TypeVar extends Type {
    public instance?: Type
    public name: string

    public static lastNameIndex = 0

    constructor() {
        super()
        this.name = `t${TypeVar.lastNameIndex++}`
    }

    occursIn(ty: Type): boolean {
        const t = ty.pruned
        if (t === this) {
            return true
        }

        if (t instanceof TypeOp) {
            return this.occursInList(t.args)
        }

        return false
    }

    occursInList(list: Type[]): boolean {
        return list.some(t => this.occursIn(t))
    }

    isGeneric(nonGeneric: NonGen): boolean {
        return !this.occursInList(Array.from(nonGeneric))
    }

    toString() {
        return `${this.name}: ${this.instance}`
    }
}

class TypeOp extends Type {
    constructor(public name: string, public args: Type[]) {
        super()
    }

    public static IntTy = new TypeOp('int', [])
    public static BoolTy = new TypeOp('bool', [])
    public static CharTy = new TypeOp('char', [])
    public static StringTy = new TypeOp('str', [])
    public static mkFuncTy = (arg: Type, ret: Type) => new TypeOp('->', [arg, ret])

    toString() {
        if (this.args.length === 0) {
            return `${this.name}`
        }

        if (this.args.length === 2) {
            return `${this.args[0]} ${this.name} ${this.args[1]}`
        }

        return `${this.name} ${this.args.join(' ')}`
    }
}

export class TypeEnv {
    constructor(public map: Record<string, Type>) {}

    extend(name: string, ty: Type): TypeEnv {
        return new TypeEnv({...this.map, [name]: ty})
    }

    getFresh(name: string, nonGeneric: NonGen): Type {
        if (name in this.map) {
            return fresh(this.map[name], nonGeneric)
        }
        throw new Error(`${name} is not defined`)
    }
}

function fresh(type: Type, nonGeneric: NonGen): Type {
    const map: WeakMap<Type, Type> = new WeakMap()

    function freshrec(ty: Type): Type {
        const t = ty.pruned
        if (t instanceof TypeVar) {
            if (t.isGeneric(nonGeneric)) {
                if (!map.has(t)) {
                    map.set(t, new TypeVar())
                }
                return map.get(t)!
            } else {
                return t
            }
        } else if (t instanceof TypeOp) {
            return new TypeOp(t.name, t.args.map(freshrec))
        } else {
            throw new Error('Unexpected type to fresh')
        }
    }

    return freshrec(type)
}

function unify(ty1: Type, ty2: Type) {
    const t1 = ty1.pruned
    const t2 = ty2.pruned

    if (t1 instanceof TypeVar && t1 !== t2) {
        if (t1.occursIn(t2)) {
            throw new Error('Recursive unification')
        }
        t1.instance = t2
    } else if (t1 instanceof TypeOp && t2 instanceof TypeVar) {
        unify(t2, t1)
    } else if (t1 instanceof TypeOp && t2 instanceof TypeOp) {
        if (t1.name !== t2.name || t1.args.length !== t2.args.length) {
            throw new Error(`Type mismatch: ${t1} vs ${t2}`)
        }
        t1.args.forEach((_, i) => unify(t1.args[i], t2.args[i]))
    } else {
        throw new Error('Unexpected types to unify')
    }
}

export function analyze(expr: Expr, env: TypeEnv, nonGeneric: NonGen): Type {
    const analyzeNode = (e: Expr) => analyze(e, env, nonGeneric)

    switch (expr.kind) {
    case 'Var': {
        return env.getFresh(expr.tok.val, nonGeneric)
    }
    case 'App': {
        const funcTy = analyzeNode(expr.lhs)
        const argTy = analyzeNode(expr.arg)
        const retTy = new TypeVar()

        unify(TypeOp.mkFuncTy(argTy, retTy), funcTy)
        return retTy
    }
    case 'Let': {
        const valTy = analyzeNode(expr.val)
        const newEnv = env.extend(expr.name.val, valTy)

        return analyze(expr.body, newEnv, nonGeneric)
    }
    case 'LetRec': {
        const newTy = new TypeVar()
        const newEnv = env.extend(expr.name.val, newTy)
        const newGenerics = new Set(Array.from(nonGeneric).concat(newTy))
        const valTy = analyze(expr.val, newEnv, newGenerics)
        
        unify(newTy, valTy)

        return analyze(expr.body, newEnv, nonGeneric)
    }
    case 'IntLit': {
        return TypeOp.IntTy
    }
    case 'BoolLit': {
        return TypeOp.BoolTy
    }
    case 'CharLit': {
        return TypeOp.CharTy
    }
    case 'StringLit': {
        return TypeOp.StringTy
    }
    default: {
        throw new Error(`Unhandled kind ${expr.kind} in 'analyze'`)
    }
    }
}
