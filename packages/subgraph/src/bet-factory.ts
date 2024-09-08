import { BetCreated as BetCreatedEvent } from "../generated/BetFactory/BetFactory"
import { Bet as BetTemplate } from "../generated/templates"
import { BetCreated } from "../generated/schema"

export function handleBetCreated(event: BetCreatedEvent): void {
  let entity = new BetCreated(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.betAddress = event.params.betAddress
  entity.betId = event.params.betId
  entity.params_name = event.params.params.name
  entity.params_description = event.params.params.description
  entity.params_prompt = event.params.params.prompt
  entity.params_endTimestamp = event.params.params.endTimestamp

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
  BetTemplate.create(event.params.betAddress)
}

