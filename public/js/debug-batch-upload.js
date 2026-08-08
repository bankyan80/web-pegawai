// Debug script untuk batch upload error
// Paste ini di console browser (F12 → Console) untuk debug

console.log('=== KEP Batch Upload Debugger ===');

// 1. Check tableModul function
if (typeof tableModul === 'function') {
  console.log('✅ tableModul function exists');
  
  // Test dengan berbagai input
  console.log('Test tableModul():');
  console.log('  tblPrs0 =>', tableModul('tblPrs0'));
  console.log('  tblPrs1 =>', tableModul('tblPrs1'));
  console.log('  modPrs0 =>', tableModul('modPrs0'));
  console.log('  tblPresensi =>', tableModul('tblPresensi'));
  console.log('  tblPegawai =>', tableModul('tblPegawai'));
  console.log('  undefined =>', tableModul(undefined));
  console.log('  empty string =>', tableModul(''));
} else {
  console.log('❌ tableModul function NOT found!');
}

// 2. Check form data-table attribute
console.log('\n=== Checking Modal Forms ===');
var forms = document.querySelectorAll('form.kep-form');
console.log('Found ' + forms.length + ' kep-form(s)');
forms.forEach(function(f, i) {
  var dataTable = f.getAttribute('data-table');
  var modul = typeof tableModul === 'function' ? tableModul(dataTable) : 'N/A';
  console.log('Form ' + i + ':');
  console.log('  data-table: "' + dataTable + '"');
  console.log('  tableModul() result: "' + modul + '"');
  console.log('  has batch wrap: ' + (f.querySelector('.kep-batch-wrap') ? 'YES' : 'NO'));
});

// 3. Check Presensi modal specifically
console.log('\n=== Checking Presensi Modal ===');
var presensiModals = document.querySelectorAll('[id^="modPrs"]');
console.log('Found ' + presensiModals.length + ' presensi modal(s)');
presensiModals.forEach(function(m) {
  var form = m.querySelector('form.kep-form');
  if (form) {
    console.log('Modal: ' + m.id);
    console.log('  Form data-table: "' + form.getAttribute('data-table') + '"');
    console.log('  Form data-modal: "' + form.getAttribute('data-modal') + '"');
  }
});

// 4. Add listener to catch submit errors
console.log('\n=== Adding Submit Event Listener ===');
document.addEventListener('submit', function(e) {
  var form = e.target;
  if (form.classList.contains('kep-form')) {
    console.log('FORM SUBMIT DETECTED');
    console.log('  Form data-table: "' + form.getAttribute('data-table') + '"');
    
    if (typeof tableModul === 'function') {
      var modul = tableModul(form.getAttribute('data-table'));
      console.log('  tableModul result: "' + modul + '"');
      if (!modul) {
        console.log('  ⚠️ ERROR: Module tidak dikenali!');
      } else {
        console.log('  ✅ Module: ' + modul);
      }
    }
    
    console.log('  Has batch wrap: ' + (form.querySelector('.kep-batch-wrap') ? 'YES' : 'NO'));
  }
}, true); // Use capture phase to log before prevention

console.log('\n=== Ready to test ===');
console.log('Now try to upload batch presensi and watch console for errors');
