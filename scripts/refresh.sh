#!/bin/bash
cd /root/Polinear
export CONGRESS_GOV_API_KEY=rYvbZlXZupSoYhE55uZTDLuDM2j4DML4Td2GtvO8
export FEC_API_KEY=svKxdjgANJemqGhUfMxAvWL2EHzYrIVFautlN697

LOGDIR=/root/Polinear/logs
mkdir -p $LOGDIR

case "$1" in
  bills)
    echo "[$(date)] Starting bills refresh" >> $LOGDIR/refresh.log
    npx tsx scripts/refresh-bills.ts >> $LOGDIR/refresh.log 2>&1
    ;;
  pacs)
    echo "[$(date)] Starting PACs refresh" >> $LOGDIR/refresh.log
    npx tsx scripts/refresh-pacs.ts >> $LOGDIR/refresh.log 2>&1
    ;;
  positions)
    echo "[$(date)] Starting positions refresh" >> $LOGDIR/refresh.log
    npx tsx scripts/refresh-positions.ts >> $LOGDIR/refresh.log 2>&1
    ;;
  all)
    echo "[$(date)] Starting full refresh" >> $LOGDIR/refresh.log
    npx tsx scripts/refresh-bills.ts >> $LOGDIR/refresh.log 2>&1
    npx tsx scripts/refresh-pacs.ts >> $LOGDIR/refresh.log 2>&1
    npx tsx scripts/refresh-positions.ts >> $LOGDIR/refresh.log 2>&1
    ;;
  *)
    echo "Usage: $0 {bills|pacs|positions|all}"
    exit 1
    ;;
esac

echo "[$(date)] Refresh $1 complete" >> $LOGDIR/refresh.log
