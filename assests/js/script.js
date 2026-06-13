var map = L.map('map').setView([51.505, -0.09], 13);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: 'Map data © <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  maxZoom: 18,
}).addTo(map);

var puntosZonasInseguras = [];
var selectedRadio = 5; // Radio seleccionado por defecto

function generarOpcionesDeRadio() {
  var radioOptions = '';
  for (var i = 5; i <= 60; i += 5) {
    radioOptions += '<input type="radio" id="radio-' + i + 'm" name="radio-selector" value="' + i + '"';
    if (i === selectedRadio) {
      radioOptions += ' checked';
    }
    radioOptions += '>';
    radioOptions += '<label for="radio-' + i + 'm">' + i + ' metros</label>';
  }
  document.getElementById('radio-container').innerHTML = radioOptions;
}

function actualizarAreasDeInfluencia() {
  // Elimina los círculos existentes del mapa
  for (var i = 0; i < puntosZonasInseguras.length; i++) {
    if (puntosZonasInseguras[i].circle) {
      map.removeLayer(puntosZonasInseguras[i].circle);
    }
  }

  // Crea los nuevos círculos de área de influencia con el radio seleccionado
  for (var i = 0; i < puntosZonasInseguras.length; i++) {
    var circle = L.circle([puntosZonasInseguras[i].lat, puntosZonasInseguras[i].lng], {
      radius: selectedRadio,
      color: 'red',
      fillColor: 'red',
      fillOpacity: 0.2
    }).addTo(map);

    puntosZonasInseguras[i].circle = circle; // Asigna el círculo al objeto puntosZonasInseguras
  }
}

map.on('click', function(e) {
  var marker = L.marker(e.latlng).addTo(map);
  var punto = { id: puntosZonasInseguras.length + 1, lat: e.latlng.lat, lng: e.latlng.lng, marker: marker };
  puntosZonasInseguras.push(punto);
  addTableRow(punto); // Agrega la fila a la tabla

  actualizarAreasDeInfluencia();
});

var radioContainer = document.getElementById('radio-container');

radioContainer.addEventListener('change', function(event) {
  selectedRadio = parseInt(event.target.value);
  actualizarAreasDeInfluencia();
});

// Generar opciones de radio al cargar la página
generarOpcionesDeRadio();

// Función para agregar una nueva fila a la tabla con los datos del punto
function addTableRow(punto) {
  var table = document.getElementById('puntos-table');
  var newRow = table.insertRow();

  var idCell = newRow.insertCell();
  idCell.textContent = punto.id;

  var latCell = newRow.insertCell();
  latCell.textContent = punto.lat;

  var lngCell = newRow.insertCell();
  lngCell.textContent = punto.lng;

  var radioCell = newRow.insertCell();
  radioCell.textContent = selectedRadio;

  var deleteCell = newRow.insertCell();
  var deleteButton = document.createElement('button');
  deleteButton.textContent = 'Eliminar';
  deleteButton.addEventListener('click', function() {
    removeTableRow(newRow);
  });
  deleteCell.appendChild(deleteButton);
}

// Función para eliminar una fila de la tabla y el marcador en el mapa
function removeTableRow(row) {
  var id = parseInt(row.cells[0].textContent);
  row.remove();

  // Elimina el marcador del mapa
  var punto = puntosZonasInseguras.find(function(punto) {
    return punto.id === id;
  });
  if (punto && punto.marker) {
    map.removeLayer(punto.marker);
  }

  // Elimina el punto del array
  puntosZonasInseguras = puntosZonasInseguras.filter(function(punto) {
    return punto.id !== id;
  });

  actualizarAreasDeInfluencia();
}

// Botón para guardar el contenido del mapa como PDF
var guardarPdfBtn = document.createElement('button');
guardarPdfBtn.textContent = 'Guardar PDF';
guardarPdfBtn.addEventListener('click', function() {
  // Opciones de configuración para html2pdf.js
  var options = {
    margin: 10,
    filename: 'mapa.pdf',
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  // Obtiene el contenedor del mapa
  var mapContainer = document.getElementById('map');

  // Crea una instancia de html2pdf con las opciones proporcionadas
  html2pdf().from(mapContainer).set(options).save();
});

// Agrega el botón de guardar PDF al contenedor correspondiente
var buttonsContainer = document.getElementById('buttons-container');
buttonsContainer.appendChild(guardarPdfBtn);





