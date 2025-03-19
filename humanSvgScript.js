const svg = document.getElementById('humanAnatomy');
const NS = $('svg').attr('xmlns');

const bodyAreas = {
  head: {
    x: 210,
    y: 50,
    info: 'Terapia Bowen ajută la durerile de cap, migrene și dureri de gât. Implică mișcări ușoare de rulare peste mușchii și fascia capului și gâtului pentru a stimula mecanismele de vindecare ale corpului, a reduce tensiunea și a îmbunătăți circulația în aceste zone. Aceasta poate ajuta la eliberarea tensiunii musculare, reducerea durerii și îmbunătățirea stării generale de bine.',
  },
  back: {
    x: 210,
    y: 180,
    info: 'Terapia Bowen ajută la durerile de spate, sciatică și probleme de postură. Implică mișcări ușoare de rulare peste mușchi și fascia pentru a stimula mecanismele de vindecare ale corpului, a reduce inflamația și a îmbunătăți circulația în zona spatelui. Aceasta poate ajuta la eliberarea tensiunii musculare, îmbunătățirea mobilității și reducerea durerii cronice.',
  },
  leftKnee: {
    x: 180,
    y: 520,
    info: 'Terapia Bowen ajută la durerile de genunchi, artrită și leziuni. Implică mișcări ușoare de rulare peste mușchi și fascia pentru a stimula mecanismele de vindecare ale corpului, a reduce inflamația și a îmbunătăți circulația în zona genunchiului.',
  },
  rightKnee: {
    x: 245,
    y: 520,
    info: 'Terapia Bowen ajută la durerile de genunchi, artrită și leziuni. Implică mișcări ușoare de rulare peste mușchi și fascia pentru a stimula mecanismele de vindecare ale corpului, a reduce inflamația și a îmbunătăți circulația în zona genunchiului.',
  },
  leftAnkle: {
    x: 174,
    y: 750,
    info: 'Terapia Bowen ajută la entorse de gleznă, întinderi și mobilitate. Implică mișcări ușoare de rulare peste mușchi și fascia pentru a stimula mecanismele de vindecare ale corpului, a reduce inflamația și a îmbunătăți circulația în zona gleznei.',
  },
  rightAnkle: {
    x: 250,
    y: 750,
    info: 'Terapia Bowen ajută la entorse de gleznă, întinderi și mobilitate. Implică mișcări ușoare de rulare peste mușchi și fascia pentru a stimula mecanismele de vindecare ale corpului, a reduce inflamația și a îmbunătăți circulația în zona gleznei.',
  },
  leftArm: {
    x: 125,
    y: 250,
    info: 'Terapia Bowen ajută la durerile de braț, cotul tenismenului și sindromul de tunel carpian. Implică mișcări ușoare de rulare peste mușchi și fascia pentru a stimula mecanismele de vindecare ale corpului, a reduce inflamația și a îmbunătăți circulația în zona brațului.',
  },
  rightArm: {
    x: 300,
    y: 250,
    info: 'Terapia Bowen ajută la durerile de braț, cotul tenismenului și sindromul de tunel carpian. Implică mișcări ușoare de rulare peste mușchi și fascia pentru a stimula mecanismele de vindecare ale corpului, a reduce inflamația și a îmbunătăți circulația în zona brațului.',
  },
  leftLeg: {
    x: 180,
    y: 610,
    info: 'Terapia Bowen ajută la durerile de picior, crampe musculare și circulație. Implică mișcări ușoare de rulare peste mușchi și fascia pentru a stimula mecanismele de vindecare ale corpului, a reduce inflamația și a îmbunătăți circulația în zona picioarelor.',
  },
  rightLeg: {
    x: 250,
    y: 610,
    info: 'Terapia Bowen ajută la durerile de picior, crampe musculare și circulație. Implică mișcări ușoare de rulare peste mușchi și fascia pentru a stimula mecanismele de vindecare ale corpului, a reduce inflamația și a îmbunătăți circulația în zona picioarelor.',
  },
  stomach: {
    x: 210,
    y: 350,
    info: 'Terapia Bowen ajută la probleme digestive, balonare și crampe. Implică mișcări ușoare de rulare peste mușchii abdominali și fascia pentru a stimula mecanismele de vindecare ale corpului, a îmbunătăți digestia, a reduce inflamația și a ameliora disconfortul în zona stomacului.',
  },
  leftWrist: {
    x: 90,
    y: 410,
    info: 'Terapia Bowen ajută la durerile de încheietură, sindromul de tunel carpian și întinderi. Implică mișcări ușoare de rulare peste mușchi, tendoane și fascia pentru a stimula mecanismele de vindecare ale corpului, a reduce inflamația și a îmbunătăți circulația în zona încheieturii.',
  },
  rightWrist: {
    x: 335,
    y: 410,
    info: 'Terapia Bowen ajută la durerile de încheietură, sindromul de tunel carpian și întinderi. Implică mișcări ușoare de rulare peste mușchi, tendoane și fascia pentru a stimula mecanismele de vindecare ale corpului, a reduce inflamația și a îmbunătăți circulația în zona încheieturii.',
  },
};

Object.keys(bodyAreas).forEach((area) => {
  const { x, y, info } = bodyAreas[area];
  const areaElement = document.createElementNS(NS, 'circle');
  areaElement.setAttributeNS(null, 'cx', x);
  areaElement.setAttributeNS(null, 'cy', y);
  areaElement.setAttributeNS(null, 'r', 20);
  areaElement.setAttributeNS(null, 'class', 'body-area');
  areaElement.setAttributeNS(null, 'id', area);
  areaElement.setAttributeNS(null, 'data-info', info);
  svg.appendChild(areaElement);
});

const bodyArea = document.getElementsByClassName('body-area');

for (let part of bodyArea) {
  part.addEventListener('mouseenter', function (e) {
    const info = $(this).data('info');
    const infoDiv = $('#infoDiv');
    const x = e.clientX;
    const y = e.clientY + window.scrollY; // Adjust for scroll position
    infoDiv.text(info).css('text-align', 'center');
    infoDiv.css({
      position: 'absolute',
      left: x + 10 + 'px',
      top: y + 'px',
      cursor: 'pointer',
    });
    infoDiv.show();
  });
  part.addEventListener('mouseleave', function () {
    $('#infoDiv').hide();
  });
}
