const tick = [];
tickLen = 10000;
for (let i = 0; i < tickLen; i++) {
  tick.push(i);
}

const initPrice = 50000;
const initAssetQty = 0.001;
let assetQty = initAssetQty;
let baseQty = initAssetQty * initPrice;
let assetStep = 0.0002;
const trailing = 0.02; //1%
const trailingBan = 0.01 //0.2%

//Perfil de price
const price = [];
for (let i = 0; i < tickLen; i++) {
  if (i == 0) {
    price.push(initPrice);
  } else {
    price.push(price[i - 1] * (1 + (Math.random()*2-1)*0.3/100) ); // maxima variación por click +-0.3
    // price.push(price[0] * (1 + 10/100*(Math.sin(100*2*Math.PI*i/tickLen)))); 
    // price.push(price[0] * (1 + 10/100*(Math.sin(100*2*Math.PI*i/tickLen)) + 20/100*i/tickLen));
    // price.push(price[0] * (1 + 10/100*(Math.sin(100*2*Math.PI*i/tickLen)) - 20/100*i/tickLen));
  }
}


//Análisis y operaciones
let operations = [];
for (let i = 0, i_min = 0, i_max = 0, i_buy = 0, i_sell = 0, status = 'INIT'; i < tickLen; i++) {
  
  if      ((status == 'SELL' || status == 'INIT') && 
            price[i] > price[i_max]) { //trailing SELL
    i_max = i;
    operations.push(0);
  }

  else if ((status == 'SELL' || status == 'INIT') && 
            price[i] < (price[i_max] * (1 - trailing)) &&
            price[i] > (price[i_buy] * (1 + trailingBan))) { //SELL
    i_min = i;
    i_sell = i;
    operations.push(-1);
    assetQty = assetQty - assetStep;
    baseQty = baseQty + assetStep * price[i];
    status = 'BUY';
  }
  
  else if ((status == 'BUY' || status == 'INIT') && 
            price[i] < price[i_min]) { //trailing BUY
    i_min = i;
    operations.push(0);
  }
  
  else if ((status == 'BUY' || status == 'INIT') &&
            price[i] > (price[i_min] * (1 + trailing)) &&
            price[i] < (price[i_sell] * (1 - trailingBan))) { //BUY
    i_max = i;
    i_buy = i;
    operations.push(1);
    assetQty = assetQty + assetStep;
    baseQty = baseQty - assetStep * price[i];
    status = 'SELL';
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


data1 = [];
data2 = [];

for (let i = 0; i < tickLen; i++) {
  data1[i] = { x: tick[i], y: price[i]};
  data2[i] = { x: tick[i], y: operations[i]};
}

