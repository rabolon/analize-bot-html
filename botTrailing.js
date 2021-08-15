// bot trailing por % del price
const plotlib = require('nodeplotlib');
const { plot, stack, clear, Plot } = plotlib;

const tick = [];
tickLen = 1000;
for (let i = 0; i < tickLen; i++) {
  tick.push(i);
}

const initPrice = 50000;
const initAssetQty = 1;
let assetQty = initAssetQty;
let baseQty = initAssetQty * initPrice;
let assetStep = 0.02;
const trailing = 0.01; //1%

//Perfil de price
const price = [];
for (let i = 0; i < tickLen; i++) {
  if (i == 0) {
    price.push(initPrice);
  } else {
    price.push(price[i - 1] * (1 + (Math.random()*2-1)*0.3/100) ); // maxima variación por click +-0.3
    //price.push(price[0] * (1 + 10/100*(Math.sin(9*2*Math.PI*i/tickLen)))); 
    //price.push(price[0] * (1 + 10/100*(Math.sin(9*2*Math.PI*i/tickLen)) + 20/100*i/tickLen));
    //price.push(price[0] * (1 + 10/100*(Math.sin(9*2*Math.PI*i/tickLen)) - 20/100*i/tickLen));
  }
}


//Análisis y operaciones
let operations = [];
for (let i = 0, i_min = 0, i_max = 0, status = 'BUY'; i < tickLen; i++) {

  if (status == 'SELL' && price[i] > price[i_max]) { //trailing SELL
    i_max = i;
    operations.push(0);
  }
  else if (status == 'SELL' && price[i] < (price[i_max] * (1 - trailing))) { //SELL
    status = 'BUY'
    i_min = i;
    operations.push(-1);
    assetQty = assetQty - assetStep;
    baseQty = baseQty + assetStep * price[i];
  }
  else if (status == 'BUY' && price[i] < price[i_min]) { //trailing BUY
    i_min = i;
    operations.push(0);
  }
  else if (status == 'BUY' && price[i] > (price[i_min] * (1 + trailing))) { //BUY
    status = 'SELL'
    i_max = i;
    operations.push(1);
    assetQty = assetQty + assetStep;
    baseQty = baseQty - assetStep * price[i];
  }
  else {
    operations.push(0);
  }  

}

//console.log('operations: ', operations);
//console.log('price: ', price);
console.log('assetStep: ', assetStep, ' (assetQty p/operation)');
console.log('buy operations: ', operations.reduce((suma, valor) => suma + (valor == 1), 0)); 
console.log('sell operations: ', operations.reduce((suma, valor) => suma + (valor == -1), 0));
console.log('assetQty: ', initAssetQty.toFixed(5), '-->',assetQty.toFixed(5));
console.log('baseQty: ', (initAssetQty * initPrice).toFixed(2), '-->', baseQty.toFixed(2));
console.log('balance in assetQty :', 
  (initAssetQty + initAssetQty).toFixed(5), 
  '-->', 
  (assetQty + baseQty / price[tickLen -1]).toFixed(5));
console.log('balance in baseQty :', 
  (initAssetQty * initPrice + initAssetQty * initPrice).toFixed(2), 
  '-->', 
  (baseQty + assetQty * price[tickLen -1]).toFixed(2));


const data1 = [{ x: tick, y: price }];
const layout1 = { 
  margin: { r: 10, t: 25, b: 40, l: 60 },
  xaxis: { autorange: true, range: [0, 5000], title: 'ticks' },
  yaxis: { autorange: true, range: [0, 12000], title: 'price' }
};

const data2 = [{ x: tick, y: operations }];
const layout2 = { 
  margin: { r: 10, t: 25, b: 40, l: 60 },
  xaxis: { autorange: true, range: [0, 5000], title: 'ticks' },
  yaxis: { autorange: true, range: [0, 12000], title: 'operations' }
};

stack(data1, layout1);
stack(data2, layout2);
plot();