const init = ($el, fn) => {
  let prevTree = {$el, elem: $el.nodeName.toLowerCase()}, tmp

  const render = () => {
    tmp = El(prevTree, fn(), $el)
    deleteRec(prevTree)
    prevTree = tmp
  }

  const deleteRec = (oldTree) => {
    (oldTree.children??[]).map(deleteRec)
    if (!oldTree.repaint) {
      oldTree.$el.remove()
      oldTree = null
    }
  }

  const El = (prev, cur, root) => {
    if (Array.isArray(cur)) cur = { children: cur }
    if (typeof cur === 'string') cur = { innerText: cur }

    cur.elem = cur.elem || 'span'

    if (!prev || (tmp = prev.elem !== cur.elem)) {
      if (prev && tmp) deleteRec(prev)
      cur.$el = new Element(cur.elem)
      root.append(cur.$el)
    } else {
      prev.repaint = true
      cur.$el = prev.$el
      cur.cleanup = prev.cleanup
    }

    let {
      $el, elem, children, cleanup, ...rest
    } = cur

    if (cleanup) for (let key in cleanup) {
      $el.removeEventListener(key.substring(2), cur.cleanup[key])
    }

    cur.cleanup = {}

    for (let key in rest) {
      if (typeof (tmp = rest[key]) == 'undefined')
        continue

      if (key.indexOf('on') != 0) {
        $el[key] = tmp
      } else {
        $el.addEventListener(
          key.substring(2),
          cur.cleanup[key] = e => {
            rest[key](e)
            render()
          }
        )
      }
    }

    if (children)
      return {
        ...cur,
        children: children.map((child, i) => El(
          prev && prev.children && prev.children[i],
          child,
          $el
        ))
      }

    return cur
  }

  render()

  return render
}

const RESERVED_PROPS = [
  'nodeName',
  'children',
  'parentElement',
  'innerText',
]

function optimizeQuotes(prop, value) {
  return `${prop}="${value}"`
}

class Element {
  constructor(nodeName) {
    this.nodeName = nodeName
    this.children = []
    this.parentElement = null
  }

  get outerHTML() {
    const properties = Object.keys(this)
      .filter(prop => {
        if (prop.indexOf('on') === 2) return false
        if (RESERVED_PROPS.includes(prop)) return false
        return true
      })
    const list = properties
      .map(prop => {
        const val = this[prop]
        if (prop === 'className') {
          return optimizeQuotes('class', val)
        }
        return optimizeQuotes(prop, val)
      }).join(' ')
    return`<${this.nodeName}${list ? ' ' + list : ''}>${this.innerHTML}</${this.nodeName}>`
  }

  get innerHTML() {
    if (this.innerText) return this.innerText

    return this.children
      .map(ch => ch.outerHTML)
      .join('')
  }

  append(el) {
    this.children.push(el)
    el.parentElement = this
  }

  remove() {
    this.parentElement.children =
      this.parentElement.children.filter(
        (el) => el != this
      )
  }

  addEventListener() { }

  removeEventListener() { }
}

export default function ssr(html, App, serverData) {
  const root = new Element('div')
  root.id = 'root'
  init(root, App)

  return html.replace(
    '<div id="root"/>',
    root.outerHTML
  )
}
