import {
  promptRequest as promptRequestEvent,
  promptsUpdated as promptsUpdatedEvent,
} from "../generated/Prompt/Prompt"
import { promptRequest, promptsUpdated } from "../generated/schema"

export function handlepromptRequest(event: promptRequestEvent): void {
  let entity = new promptRequest(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.requestId = event.params.requestId
  entity.sender = event.params.sender
  entity.modelId = event.params.modelId
  entity.prompt = event.params.prompt

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handlepromptsUpdated(event: promptsUpdatedEvent): void {
  let entity = new promptsUpdated(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.requestId = event.params.requestId
  entity.modelId = event.params.modelId
  entity.input = event.params.input
  entity.output = event.params.output
  entity.callbackData = event.params.callbackData

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
