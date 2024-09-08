import { BetMade as BetMadeEvent, BetResolved as BetResolvedEvent, WinningsClaimed as WinningsClaimedEvent } from '../generated/templates/Bet/Bet';
import { BetMade, BetResolved, WinningsClaimed } from '../generated/schema';

export function handleBetMade(event: BetMadeEvent): void {
    let entity = new BetMade(
      event.transaction.hash.concatI32(event.logIndex.toI32())
    )
    entity.betAddress = event.address;
    entity.bettor = event.params.bettor;
    entity.side = event.params.side;
    entity.amount = event.params.amount;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();
}

export function handleBetResolved(event: BetResolvedEvent): void {
    let entity = new BetResolved(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )

    entity.betAddress = event.address;
    entity.result = event.params.result;
    entity.totalTrueBetAmount = event.params.totalTrueBetAmount;
    entity.totalFalseBetAmount = event.params.totalFalseBetAmount;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();
}

export function handleWinningsClaimed(event: WinningsClaimedEvent): void {
    let entity = new WinningsClaimed(
        event.transaction.hash.concatI32(event.logIndex.toI32())
    )

    entity.betAddress = event.address;
    entity.bettor = event.params.bettor;
    entity.amount = event.params.amount;
    entity.blockNumber = event.block.number;
    entity.blockTimestamp = event.block.timestamp;
    entity.transactionHash = event.transaction.hash;

    entity.save();
}



