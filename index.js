"use strict";

let constructors = [];
function newConstructor(fn,c) {
  constructors.push([fn, c]);
}

// Normal Print Function
newConstructor('native',{
    paren: [{
      open: '(',
      close: ')'
    },
    {
      open: '[',
      close: ']'
    },
    {
      open: '{',
      close: '}'
    }],
    quoteSets: ['"',"'",'`'],
    whitespace: [' ','  '],
    c: 'native function $1 {$2}',
    map: [['1','name'],['2','code']],
    evalParams: []
});
newConstructor('constructor',{
    paren: [{
      open: '(',
      close: ')'
    },
    {
      open: '[',
      close: ']'
    },
    {
      open: '{',
      close: '}'
    }],
    quoteSets: ['"',"'",'`'],
    whitespace: [' ','  '],
    c: 'constructor $1 ({$2},{$3},{$4})',
    map: [['1','name'],['2','constructor'],['3','map'],['4','evalParams']],
    evalParams: []
});




let fns = {
  native: (ARGS) => {
    //console.log(ARGS.code.trim('\n').trim())
    fns[ARGS.name] = Function("return "+ARGS.code.trim('\n').trim())();
  },
  constructor: (ARGS) => {
    newConstructor(ARGS.name,{
    paren: syntax.paren,
    quoteSets: ['"',"'",'`'],
    whitespace: [' ','  '],
    c: ARGS.constructor,
    map: JSON.parse(ARGS.map),
    evalParams: JSON.parse(ARGS.evalParams)
    });
  },
  printDBL: (ARGS) => {
    console.log(ARGS.label+": "+ARGS.content);
  }
}

// Back to Actual Engine

function allZero(arr) {
  for(let i in arr) {
    if(arr[i]!=0) {
      return false;
    }
  }
  return true;
}

function splitFromConstructor(txt,c) {
  let p = [];
  for(let i in c.paren) {
    p.push(0);
  }
  let q = [];
  for(let i in c.quoteSets) {
    q.push(0);
  }
  let params = {};
  let j = 0;
  //if(!txt) {
    //console.log(txt);
    //throw Error(txt);
  //}
  for(let i=0; i<txt.length; i++) {
    if(txt[i] == c.c[j]) {
      j++;
    } else {
      if(c.c[j]=="$") {
        //i++;
        j+=2;
        params[c.c[j-1]] = ""
        while(!((txt[i]==c.c[j]||(i>txt.length-1))&&allZero(p)&&allZero(q))) {
          params[c.c[j-1]] += txt[i];
          if(allZero(q)) {
            for(let k in c.paren) {
              if(txt[i] == c.paren[k].open) {
                p[k] = p[k] + 1;
              }
              if(txt[i] == c.paren[k].close) {
                p[k] = p[k] - 1;
              }
            }
          }
          for(let k in c.quoteSets) {
            if(txt[i] == c.quoteSets[k]) {
              q[k] = 1 - q[k];
            }
          }
          if(i > txt.length+1) {
            //console.log(allZero(q),allZero(p));
            throw Error("Past propper range; check that quotes and parentheses match.")
          }
          i++;
        }
        i--;
      } else {
        throw ("Incorrect constructor")
      }
    }
  } 
  return params;
}

function mapParam(map,param) {
  for(let jkl=0; jkl<map.length; jkl++) {
    if(map[jkl][0]==param) {
      return map[jkl][1];
    }
  }
  return '[UN-NAMED PARAMS]';
}

function readFunction(txt) {
  if(txt=="") {
    return "";
  }
  //console.log(txt);
  let curr = {};
  let fn = '';
  let map = [];
  let evalParams = false;
  for(let l=0; l<constructors.length; l++) {
    try {
      //console.log(txt);
      curr = splitFromConstructor(txt,constructors[l][1]);
      fn = constructors[l][0];
      evalParams = constructors[l][1].evalParams;
      map = constructors[l][1].map;
    } catch(err) {
      if(err == 'Incorrect constructor') {
        continue;
      } else {
        throw err;
      }
    }
  }
  let ncurr = {};
  for(let l in curr) {
    ncurr[mapParam(map,l)] = curr[l];
  }
  if(evalParams) {
    for(let l of evalParams) {
      ncurr[l] = readFunction(ncurr[l]);
    }
  }
  if(fn!='') {
    return fns[fn](ncurr);
  } else{
    throw Error('Function does not exist.')
  }
}

let syntaxoptions = {
    paren: [{
      open: '(',
      close: ')'
    },
    {
      open: '[',
      close: ']'
    },
    {
      open: '{',
      close: '}'
    }],
    quoteSets: ['"',"'",'`'],
    whitespace: [' ','  '],
    lineend: "\n",
    indents: '  '
};

function compileLines(txt,c) {
  let code;
  if(c.indents) {
  let stuff = txt.split('\n');
  let indentLevel = 0;
  for(let jkl in stuff) {
    for(let counter = 0; counter<indentLevel; counter++) {
      if(stuff[jkl].search(c.indents)==-1) {
        indentLevel = counter;
        //stuff[jkl] = "}" + stuff[jkl];
        stuff[jkl-1] += "\n}"
      } else {
        stuff[jkl] = stuff[jkl].replace(c.indents,'');
      }
    }
    if(stuff[jkl].search(c.indents)!=-1) {
      indentLevel++;
      stuff[jkl] = stuff[jkl].replace(c.indents,"");
      stuff[jkl-1] += " {"
    }
  }
  code = stuff.join('\n');
  //console.log(code);
  } else {
  code = txt;
  }

  let lines = [''];
  let p = [];
  for(let i in c.paren) {
    p.push(0);
  }
  let q = [];
  for(let i in c.quoteSets) {
    q.push(0);
  }
  for(let j=0; j<code.length; j++) {
    lines[lines.length-1] += code[j];
  if(allZero(q)) {
    for(let k in c.paren) {
      if(code[j] == c.paren[k].open) {
        p[k] = p[k] + 1;
      }
      if(code[j] == c.paren[k].close) {
        p[k] = p[k] - 1;
      }
    }
  }
  for(let k in c.quoteSets) {
    if(code[j] == c.quoteSets[k]) {
      q[k] = 1 - q[k];
    }
  }
  if(allZero(q)&&allZero(p)&&code[j]==c.lineend) {
    //console.log(q,p);
    lines.push('');
  }
  
  }
  lines = lines.map(n=>{
    let z = n;
    for(let xyz in c.whitespace) {
    while(z.search(c.whitespace[xyz])==0) {
      z = z.trim(c.whitespace[xyz]);
    }
    }
    z = z.trim("\n");
    return z;
  });
  return lines;


}

/* Edit your syntax here */
let syntax = {
    paren: [{
      open: '(',
      close: ')'
    },
    {
      open: '[',
      close: ']'
    },
    {
      open: '{',
      close: '}'
    }],
    quoteSets: ['"',"'",'`'],
    whitespace: [' ','  '],
    lineend: "\n",
    indents: '  '
};

let fs = require('fs');
/* Read Flare language program */
let program = fs.readFileSync('setup/language.flsetup').toString();
let _l = compileLines(program,syntaxoptions);
for(let line of _l) {
  readFunction(line);
}

/* Remove Flare constructors to make this YOUR langauge */
constructors.shift();
constructors.shift();

/* Read your program */
program = fs.readFileSync('index.flare').toString();
_l = compileLines(program,syntax);
for(let line of _l) {
  readFunction(line);
}