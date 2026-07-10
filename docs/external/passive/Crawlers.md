---
title: Crawlers
sidebar_position: 1
---

## ¿Qué es?

Ve que esta indexado en el sitio web

### robots.txt

### /.well-known/

https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml

| URI Suffix                     | Description                                                                                           | Status      | Reference                                                                               |
| ------------------------------ | ----------------------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| `security.txt`                 | Contains contact information for security researchers to report vulnerabilities.                      | Permanent   | RFC 9116                                                                                |
| `/.well-known/change-password` | Provides a standard URL for directing users to a password change page.                                | Provisional | https://w3c.github.io/webappsec-change-password-url/#the-change-password-well-known-uri |
| `openid-configuration`         | Defines configuration details for OpenID Connect, an identity layer on top of the OAuth 2.0 protocol. | Permanent   | http://openid.net/specs/openid-connect-discovery-1_0.html                               |
| `assetlinks.json`              | Used for verifying ownership of digital assets (e.g., apps) associated with a domain.                 | Permanent   | https://github.com/google/digitalassetlinks/blob/master/well-known/specification.md     |
| `mta-sts.txt`                  | Specifies the policy for SMTP MTA Strict Transport Security (MTA-STS) to enhance email security.      | Permanent   | RFC 8461                                                                                |

### **hakrawler**

- [https://github.com/hakluke/hakrawler](https://github.com/hakluke/hakrawler)

### **katana (de ProjectDiscovery)**

- [https://github.com/projectdiscovery/katana](https://github.com/projectdiscovery/katana)

### **GoSpider**

- [https://github.com/jaeles-project/gospider](https://github.com/jaeles-project/gospider)

###  **ParamSpider**

- [https://github.com/devanshbatham/paramspider](https://github.com/devanshbatham/paramspider)

###  **LinkFinder** (para JS parsing)

- [https://github.com/GerbenJavado/LinkFinder](https://github.com/GerbenJavado/LinkFinder)

###  **waymore**

- [https://github.com/xnl-h4ck3r/waymore](https://github.com/xnl-h4ck3r/waymore)

Crawling extendido + Wayback + URLGrab + JS parsing

###  **Arjun**

- [https://github.com/s0md3v/Arjun](https://github.com/s0md3v/Arjun)

Especializado en descubrir **parámetros ocultos** en endpoints

### Scrapy

```bash
pip3 install scrapy
```



```
javascript:(function(){var scripts=document.getElementsByTagName("script"),regex=/(?<=(\"|\'|\`))\/[a-zA-Z0-9_?&=\/\-\#\.]*(?=(\"|\'|\`))/g;const results=new Set;for(var i=0;i<scripts.length;i++){var t=scripts[i].src;""!=t&&fetch(t).then(function(t){return t.text()}).then(function(t){var e=t.matchAll(regex);for(let r of e)results.add(r[0])}).catch(function(t){console.log("An error occurred: ",t)})}var pageContent=document.documentElement.outerHTML,matches=pageContent.matchAll(regex);for(const match of matches)results.add(match[0]);function writeResults(){results.forEach(function(t){document.write(t+"<br>")})}setTimeout(writeResults,3e3);})();
```