Authors
=========
Nishant Das Patnaik (nishant.dp@)

Sarathi Sabyasachi Sahoo (sarathisahoo@)

Introduction
===============
Today, more and more developers are switching to JavaScript as their first choice of language. The reason is simple JavaScript has now been started to be accepted as the mainstream programming for applications, be it on the web or on the mobile; be it on client-side, be it on the server side. JavaScript flexibility and its loose typing is friendly to developers to create rich applications at an unbelievable speed. Major advancements in the performance of JavaScript interpreters, in recent days, have almost eliminated the question of scalability and throughput from many organizations. So the point is JavaScript is now a really important and powerful language we have today and it's usage growing everyday. From client-side code in web applications it grew to server-side through Node.JS and it's now supported as proper language to write applications on major mobile operating system platforms like Windows 8 apps and the upcoming Firefox OS apps.

But the problem is, many developers practice insecure coding which leads to many client side attacks, out of which DOM XSS is the most infamous. We tried to understand the root cause of this problem and figured out is that there are not enough practically usable tools that can solve real-world problems. Hence as our first attempt towards solving this problem, we want to talk about JSPrime: A JavaScript static analysis tool for the rest of us. It's a very light-weight and very easy to use point-and-click tool! The static analysis tool is based on the very popular Esprima ECMAScript parser by Aria Hidayat.

I would like to highlight some of the interesting features of the tool below:

* JS Library Aware Source & Sinks
* Most dynamic or static analyzers are developed to support native/pure JavaScript which actually is a problem for most developers since the introductions and wide-adoption for JavaScript frameworks/libraries like jQuery, YUI etc. Since these scanners are designed to support pure JavaScript, they fail at understanding the context of the development due to the usage of libraries and produce many false-positives and false-negatives. To solve this we have identified the dangerous user input sources and code execution sink functions for jQuery and YUI, for the initial release and we shall talk about how users can easily extend it for other frameworks.
* Variable & Function Tracing (This feature is a part of our code flow analysis algorithm)
* Variable & Function Scope Aware analysis (This feature is a part of our code flow analysis algorithm)
* Known filter function aware
* OOP & Protoype Compliant
* Minimum False Positive alerts
* Supports minified JavaScript
* Blazing fast performance
* Point and Click :-) (my personal favorite)

Upcoming features:

* Automatic code de-obfuscation & decompression through Hybrid Analysis (Ra.2 improvisation; http://code.google.com/p/ra2-dom-xss-scanner)
* ECMAScript family support (ActionScript 3, Node.JS, WinJS)

Links
=====
* [Test Cases](http://goo.gl/vf61Km)
* [Sources & Sinks](http://goo.gl/olzYM4)
* [BlackHat Slides](http://www.slideshare.net/nishantdp/jsprime-bhusa13new)

Usage
=======
Web Client
----------
Open "index.html" in your browser.

Server-Side (Node.JS)
---------------------
1. In the terminal type "node server.js"
2. Go to 127.0.0.1:8888 in your browser.

