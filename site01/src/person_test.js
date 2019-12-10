const Person = require('./person');
const f = require('./func');


const p = new Person('Peter', 28);

console.log(p.toJSON());
console.log(f(10));