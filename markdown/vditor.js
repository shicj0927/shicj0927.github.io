const addScript = (path, callback) => {
  const scriptElement = document.createElement('script')
  scriptElement.src = path
  scriptElement.async = true
  document.head.appendChild(scriptElement)
  scriptElement.onload = () => {
    callback()
  }
}

const addStyle = (url) => {
  const styleElement = document.createElement('link')
  styleElement.rel = 'stylesheet'
  styleElement.type = 'text/css'
  styleElement.href = url
  document.getElementsByTagName('head')[0].appendChild(styleElement)
}

const updateCode = (btnElement, code) => {
  if (btnElement.classList.contains('btn--red')) {
    return
  } else {
    const redBtnElement = document.querySelector('.btn--red')
    if (redBtnElement) {
      redBtnElement.classList.remove('btn--red')
    }
    btnElement.classList.add('btn--red')
  }

  const demoCodeElement = document.getElementById('vditorDemoCode')
  demoCodeElement.firstElementChild.innerHTML = `<code>${code}
</code>`
  Vditor.highlightRender({lineNumber: true, enable: true}, demoCodeElement, "https://cdn.jsdelivr.net/npm/vditor")
  Vditor.codeRender(demoCodeElement)
}

const autoType = () => {
  const typeElement = document.getElementById('autoType')
  if (!typeElement) {
    return
  }
  const texts = [
    '实现 CommonMark 和 GFM 规范',
    '支持数学公式、图表、五线谱、脑图等14+渲染',
    '所见即所得（wysiwyg）',
    '即时渲染（ir）',
    '分屏预览（sv）',
    '易于使用的 Markdown 编辑器，为适配不同的应用场景而生',
  ]
  let textLength = 0
  let time = 0
  texts.forEach((text, i) => {
    if (i > 0) {
      textLength += text[i - 1].length + 20
    }
    for (let j = 0; j < text.length; j++) {
      time += 200
      setTimeout(() => {
        typeElement.innerHTML = text.substr(0, j + 1) +
          `<span class="caret" style="${(j === text.length - 1
            ? 'animation-name:flash'
            : '')}"></span>`
      }, time)
    }
    if (i !== texts.length - 1) {
      time += 2000
      for (let k = 0; k < text.length; k++) {
        time += 50
        setTimeout(() => {
          typeElement.innerHTML = typeElement.textContent.substr(0,
            typeElement.textContent.length - 1) + '<span class="caret"></span>'
        }, time)
      }
    } else {
      setTimeout(() => {
        document.querySelector('.caret').style.animationName = 'flash'
      }, time + 1)
    }
  })
}

addStyle('https://cdn.jsdelivr.net/npm/vditor@3.9.7/dist/index.css')
document.addEventListener('DOMContentLoaded', function () {
  autoType();

  if (true) {
    addScript('https://cdn.jsdelivr.net/npm/vditor@3.9.7/dist/index.min.js',
      () => {
        const demoCodeElement = document.getElementById('vditorDemoCode')
        if (demoCodeElement) {
          Vditor.highlightRender({lineNumber: true, enable: true},
            demoCodeElement, "https://cdn.jsdelivr.net/npm/vditor")
          Vditor.codeRender(demoCodeElement)
        }
        if (typeof vditorScript !== 'undefined') {
          vditorScript()
        }

      })
  }

})
