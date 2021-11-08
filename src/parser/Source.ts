import { Span } from './Token'

type Line = {pos: number, content: string}

export class Source {
    code: string
    lines: string[]
    linesPositions: number[]
    size: number

    constructor(code: string, lines: string[], linesPositions: number[], size: number) {
        this.code = code
        this.lines = lines
        this.linesPositions = linesPositions
        this.size = size
    }

    public getSpanLine(span: Span): Line {
        const lines: Line[] = []

        for (let i = 0; i < this.linesPositions.length; i++) {
            const linePos = this.linesPositions[i]

            if (span.pos < linePos) {
                break
            }

            const nextLinePos = i < this.linesPositions.length - 1 ? this.linesPositions[i + 1] : this.size

            if (span.pos >= linePos && span.pos < nextLinePos) {
                lines.push({
                    pos: linePos,
                    content: this.lines[i],
                })
            }
        }

        if (!lines.length) {
            throw new Error(`Cannot get line by span ${span.str()}`)
        }

        return lines[0]
    }
}
