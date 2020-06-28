<?php

require("inc.filmdata.php");

$url = 'https://spreadsheets.google.com/feeds/list/'.$sheetID.'/1/public/values?alt=json';
$file= file_get_contents($url);

$json = json_decode($file);
$rows = $json->{'feed'}->{'entry'};
foreach($rows as $row) {
	unset($row->{'id'});
	unset($row->{'link'});
	unset($row->{'content'});
	unset($row->{'gsx$e-mail-adresse'});
	unset($row->{'gsx$e-mail'});
	unset($row->{'gsx$legalconfirmation'});
}

$json_data = json_encode($rows, JSON_PRETTY_PRINT);
file_put_contents('film-data.json', $json_data);

?>