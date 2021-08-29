
// let fecha = 'August 29, 2021 00:00:00';
// let date1 = new Date(fecha);
// let date2 = new Date(fecha);

let date1 = new Date();
let date2 = new Date();
let dateOffset = (24 * 60 * 60 * 1000) * 90;
date1.setTime(date1.getTime() - dateOffset);

console.log(date1.getTime(), date2.getTime()); //1620054000000  1627830000000
console.log('período de la muestra en días:   ', (date2 - date1) / 3600000 / 24);

const urlBase = 'https://api.coingecko.com/api/v3';
const urlCommand = `/coins/bitcoin/market_chart/range?vs_currency=usd&from=${date1.getTime() / 1000}&to=${date2.getTime() / 1000}`;

const resultado = axios.get(urlBase + urlCommand)
  .catch(function (err) {
    return console.error(err);
  })
  .then(function (response) {
    console.log('aprox. minutos entre muestras:  ', (response.data.prices[1][0] - response.data.prices[0][0]) / 1000 / 60);

    // response.data.prices.forEach((value, index, array) => {
    //   var temp = new Date(array[index][0]).toISOString();
    //   console.log(temp, array[index][1]);
    // });

    const times = response.data.prices.map((value, index, array) => {
      return new Date(array[index][0]).toISOString();
    });

    console.log(times);

    const { tick, price, operations } = botTrailingBan(response);
    console.log(tick);
    console.log(price);

    const pricePercent = price.map((value, index, array) => {
      return (value - array[0]) / array[0] * 100;
    });

    const operationsPercent = operations.map((value, index, array) => {
      if (!isNaN(value)) return value = pricePercent[index];
    });

    const colors = operations.map((value, index, array) => {
      if (value === 1) return value = 'green';
      else if (value === -1) return value = 'red';
      else return value = 'white';
      
    });
    
    grafica(tick, times, pricePercent, operationsPercent, colors);

  });

function botTrailingBan(response) {
  console.log('hola mundo');
  console.log(response.data.prices[1][0]);

  let tick = [];
  const tickLen = response.data.prices.length;
  console.log(`ticklen: ${tickLen}`);
  for (let i = 0; i < tickLen; i++) {
    tick.push(i);
  }

  let price = response.data.prices.map((value) => value[1]);
  const initPrice = price[0];

  // const initPrice = 50000; // comment for Price profile

  const initAssetQty = 0.001;
  let assetQty = initAssetQty;
  let baseQty = initAssetQty * initPrice;
  let assetStep = 0.0002;
  const trailing = 0.01; //1%
  const trailingBan = 0.01 //0.2%

  // // Price profile
  // const price = [];
  //   for (let i = 0; i < tickLen; i++) {
  //   if (i == 0) {
  //     price.push(initPrice);
  //   } else {
  //     price.push(price[i - 1] * (1 + (Math.random()*2-1)*0.3/100) ); // maxima variación por click +-0.3
  //     // price.push(price[0] * (1 + 10/100*(Math.sin(100*2*Math.PI*i/tickLen)))); 
  //     // price.push(price[0] * (1 + 10/100*(Math.sin(100*2*Math.PI*i/tickLen)) + 20/100*i/tickLen));
  //     // price.push(price[0] * (1 + 10/100*(Math.sin(100*2*Math.PI*i/tickLen)) - 20/100*i/tickLen));
  //   }
  // }


  //Análisis y operaciones
  let operations = [];
  for (let i = 0, i_min = 0, i_max = 0, i_buy = 0, i_sell = 0, status = 'INIT'; i < tickLen; i++) {

    if ((status == 'SELL' || status == 'INIT') &&
      price[i] > price[i_max]) { //trailing SELL
      i_max = i;
      operations.push(NaN);
    }

    else if ((status == 'SELL' || status == 'INIT') && (price[i] < (price[i_max] * (1 - trailing)))) {
      if (price[i] > (price[i_buy] * (1 + trailingBan))) {
        i_min = i;
        i_sell = i;
        operations.push(-1);
        assetQty = assetQty - assetStep;
        baseQty = baseQty + assetStep * price[i];
        status = 'BUY';
      } else {
        i_min = i;
        operations.push(NaN);
        status = 'BUY';

      }
    }

    else if ((status == 'BUY' || status == 'INIT') &&
      price[i] < price[i_min]) { 
      i_min = i;
      operations.push(NaN);
    }

    else if ((status == 'BUY' || status == 'INIT') && (price[i] > (price[i_min] * (1 + trailing)))) {
      if (price[i] < (price[i_sell] * (1 - trailingBan))) {
        i_max = i;
        i_buy = i;
        operations.push(1);  //antes 1
        assetQty = assetQty + assetStep;
        baseQty = baseQty - assetStep * price[i];
        status = 'SELL';
      } else {
        i_max = i;
        operations.push(NaN);
        status = 'SELL';
      }
    }

    else {
      operations.push(NaN);
    }
  }

  //console.log('operations: ', operations);
  //console.log('price: ', price);
  console.log('assetStep: ', assetStep, ' (assetQty p/operation)');
  console.log('buy operations: ', operations.reduce((suma, valor) => suma + (valor == 1), 0));
  console.log('sell operations: ', operations.reduce((suma, valor) => suma + (valor == -1), 0));
  console.log('assetQty: ', initAssetQty.toFixed(5), '-->', assetQty.toFixed(5));
  console.log('baseQty: ', (initAssetQty * initPrice).toFixed(2), '-->', baseQty.toFixed(2));
  console.log('balance in assetQty :',
    (initAssetQty + initAssetQty).toFixed(5),
    '-->',
    (assetQty + baseQty / price[tickLen - 1]).toFixed(5));
  console.log('balance in baseQty :',
    (initAssetQty * initPrice + initAssetQty * initPrice).toFixed(2),
    '-->',
    (baseQty + assetQty * price[tickLen - 1]).toFixed(2));

  return { tick, price, operations };
}

function grafica(tick, times, price, operations, colors) {

  var trace1 = {
    x: times,
    y: price,
    name: 'prices',
    mode: 'lines+markers',
    marker: {color: 'gray'},
    type: 'scatter'
  };

  var trace2 = {
    x: times,
    y: operations,
    name: 'operations',
    //yaxis: 'y2',
    mode: 'markers',
    type: 'scatter',
    marker: {
      color: colors,
      size: 9,
    },
    range: [-30, 30]
  };

  var data = [trace1, trace2];

  var layout = {
    title: 'Bot trailing and ban analyze',
    height: 600,
    //width: 1000,
    yaxis: { title: 'asset prices' },
    yaxis2: {
      title: 'operations',
      titlefont: { color: 'rgb(148, 103, 189)' },
      tickfont: { color: 'rgb(148, 103, 189)' },
      overlaying: 'y',
      side: 'right',
      range: [-30, 30]
    }
  };

  Plotly.newPlot('plot', data, layout, { scrollZoom: true });
}