// ==UserScript==
// @name         Link to lglg.top
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  ç”¨lglg.topæ‰“å¼€æ´›è°·çŒæ°´åŒºé“¾æŽ¥
// @author       shicj
// @match        https://www.luogu.com.cn/discuss?forum=problem
// @match        https://www.luogu.com.cn/discuss?forum=academics
// @match        https://www.luogu.com.cn/discuss?forum=relevantaffairs
// @match        https://www.luogu.com.cn/discuss?forum=service
// @match        https://www.luogu.com.cn/discuss?forum=*
// @match        https://www.luogu.com.cn/problem/*
// @grant        none
// ==/UserScript==

// Copyright (c) 2025 shicj

(function() {
    /*
    const elements = document.querySelectorAll('*');
    elements.forEach(element => {
        const clone = element.cloneNode(true);
        element.parentNode.replaceChild(clone, element);
    });
    */
    setInterval(function(){
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
                const clone = link.cloneNode(true);
                link.parentNode.replaceChild(clone, link);
            }
        }
    },1000);
})();
