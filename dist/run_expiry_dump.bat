@echo off
setlocal

REM Define source and destination file paths
set "sourceFile1=D:\TreadingView\Projects\TradDetector-NSE\dist\expiry.txt"
set "destinationFile1=D:\TreadingView\Projects\CandleChartUI\dist\assets\file_expiry.txt"
set "destinationFile2=D:\TreadingView\Projects\CandleChartUI\distfile_expiry.txt"

REM file_expiry.txt Clear the destination file by redirecting nothing to it
> "%destinationFile1%" echo:

REM distfile_expiry.txt Clear the destination file by redirecting nothing to it
> "%destinationFile2%" echo:


REM Copy the contents of the source file to the destination file
copy "%sourceFile1%" "%destinationFile1%"

REM Copy the contents of the source file to the destination file
copy "%sourceFile1%" "%destinationFile2%"

echo Contents of %sourceFile1% have been copied to %destinationFile1% and the previous content was cleared.

echo Contents of %sourceFile1% have been copied to %destinationFile2% and the previous content was cleared.

pause
