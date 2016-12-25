// React
import React from 'react';
import {render} from 'react-dom';

// React Router
import { Router, Route, Link, browserHistory} from 'react-router'
import ReactMarkdown from 'react-markdown'

// Nav Bar Pages
import About from './about.jsx';
import Archive from './archive.jsx';
import Contact from './contact.jsx';
import Main from './main.jsx';
import Resume from './resume.jsx';
import {
  Alchemist,
  BlogRust,
  HaskellRust,
  StdMacros,
  StrString,
  OneRust,
  Pipers,
  RussianDolls,
  RustHaskell,
  SchemeEx1,
  SchemeInput,
  SchemeParser,
  SchrodingersBug,
  WhereClauses,
} from './posts.jsx';

render(
      <div>
        <Router history={browserHistory}>
          <Route path="/" component={Main}>
            <Route path="about" component={About}/>
            <Route path="archive" component={Archive}/>
            <Route path="contact" component={Contact}/>
            <Route path="resume" component={Resume}/>
            <Route path="announcing-alchemist" component={Alchemist}/>
            <Route path="blog-about-rust" component={BlogRust}/>
            <Route path="haskell-rust" component={HaskellRust}/>
            <Route path="how-do-i-std-macros" component={StdMacros}/>
            <Route path="how-do-i-str-string" component={StrString}/>
            <Route path="1-year-of-rust" component={OneRust}/>
            <Route path="pipers" component={Pipers}/>
            <Route path="russian-dolls" component={RussianDolls}/>
            <Route path="rust-haskell" component={RustHaskell}/>
            <Route path="scheme-ex1" component={SchemeEx1}/>
            <Route path="scheme-input" component={SchemeInput}/>
            <Route path="scheme-parser" component={SchemeParser}/>
            <Route path="schrodingers-bug" component={SchrodingersBug}/>
            <Route path="understanding-where-clauses" component={WhereClauses}/>
          </Route>
        </Router>
      </div>
      , document.getElementById('root'));
