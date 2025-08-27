/**
 * CKAN Data Preview Filter JavaScript
 */

function initializeDataFilter() {
    var $ = jQuery;
    
    // Search functionality
    $('#ckan-preview-search').on('keyup', function() {
        var searchTerm = $(this).val().toLowerCase();
        var $table = $('.ckan-preview-table, #excel-preview-table').first();
        
        if ($table.length === 0) return;
        
        $table.find('tbody tr').each(function() {
            var $row = $(this);
            var text = $row.text().toLowerCase();
            
            if (text.indexOf(searchTerm) > -1) {
                $row.show();
            } else {
                $row.hide();
            }
        });
    });
    
    // Export to CSV
    $('#ckan-preview-export-csv').on('click', function() {
        var $table = $('.ckan-preview-table, #excel-preview-table').first();
        if ($table.length === 0) return;
        
        var csv = [];
        
        // Headers
        var headers = [];
        $table.find('thead th').each(function() {
            headers.push('"' + $(this).text().replace(/"/g, '""') + '"');
        });
        csv.push(headers.join(','));
        
        // Rows
        $table.find('tbody tr:visible').each(function() {
            var row = [];
            $(this).find('td').each(function() {
                row.push('"' + $(this).text().replace(/"/g, '""') + '"');
            });
            csv.push(row.join(','));
        });
        
        // Download
        downloadFile(csv.join('\n'), 'export.csv', 'text/csv;charset=utf-8;');
    });
    
    // Export to Excel
    $('#ckan-preview-export-excel').on('click', function() {
        var $table = $('.ckan-preview-table, #excel-preview-table').first();
        if ($table.length === 0) return;
        
        // Create workbook
        var wb = XLSX.utils.book_new();
        
        // Convert table to worksheet
        var ws = XLSX.utils.table_to_sheet($table[0]);
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, "Data");
        
        // Write file
        XLSX.writeFile(wb, "export.xlsx");
    });
    
    // Helper function to download file
    function downloadFile(content, filename, mimeType) {
        var blob = new Blob(['\ufeff' + content], { type: mimeType }); // Add BOM for UTF-8
        var link = document.createElement('a');
        
        if (navigator.msSaveBlob) {
            // IE 10+
            navigator.msSaveBlob(blob, filename);
        } else {
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
}