@echo off
cd /d "c:/Users/MY COMPUTER/Downloads/TicketHub"
node --env-file=.env scripts/diagnose-env.js > diagnose-output.txt 2>&1
type diagnose-output.txt

