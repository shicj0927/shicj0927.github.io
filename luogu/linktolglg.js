// ==UserScript==
// @name         Link to lglg.top
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  用lglg.top打开洛谷灌水区链接
// @author       shicj
// @match        https://www.luogu.com.cn/discuss?forum=problem
// @match        https://www.luogu.com.cn/discuss?forum=academics
// @match        https://www.luogu.com.cn/discuss?forum=relevantaffairs
// @match        https://www.luogu.com.cn/discuss?forum=service
// @match        https://www.luogu.com.cn/discuss?forum=P*
// @grant        none
// ==/UserScript==

window.addEventListener('load',function() {
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
        const clone = element.cloneNode(true);
        element.parentNode.replaceChild(clone, element);
    });
    const links = document.getElementsByTagName('a');
    console.log("Link to lglg.top")
    console.log(links)
    for (let link of links) {
        var h=link.href
        if(h.includes("https://www.luogu.com.cn/discuss/")){
            console.log(h)
            link.href=h.replace("https://www.luogu.com.cn/discuss/","https://lglg.top/")
            link.setAttribute('onclick','');
            console.log(link.href)
        }
    }
},false);

