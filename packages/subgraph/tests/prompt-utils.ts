import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address, Bytes } from "@graphprotocol/graph-ts"
import { promptRequest, promptsUpdated } from "../generated/Prompt/Prompt"

export function createpromptRequestEvent(
  requestId: BigInt,
  sender: Address,
  modelId: BigInt,
  prompt: string
): promptRequest {
  let promptRequestEvent = changetype<promptRequest>(newMockEvent())

  promptRequestEvent.parameters = new Array()

  promptRequestEvent.parameters.push(
    new ethereum.EventParam(
      "requestId",
      ethereum.Value.fromUnsignedBigInt(requestId)
    )
  )
  promptRequestEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )
  promptRequestEvent.parameters.push(
    new ethereum.EventParam(
      "modelId",
      ethereum.Value.fromUnsignedBigInt(modelId)
    )
  )
  promptRequestEvent.parameters.push(
    new ethereum.EventParam("prompt", ethereum.Value.fromString(prompt))
  )

  return promptRequestEvent
}

export function createpromptsUpdatedEvent(
  requestId: BigInt,
  modelId: BigInt,
  input: string,
  output: string,
  callbackData: Bytes
): promptsUpdated {
  let promptsUpdatedEvent = changetype<promptsUpdated>(newMockEvent())

  promptsUpdatedEvent.parameters = new Array()

  promptsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "requestId",
      ethereum.Value.fromUnsignedBigInt(requestId)
    )
  )
  promptsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "modelId",
      ethereum.Value.fromUnsignedBigInt(modelId)
    )
  )
  promptsUpdatedEvent.parameters.push(
    new ethereum.EventParam("input", ethereum.Value.fromString(input))
  )
  promptsUpdatedEvent.parameters.push(
    new ethereum.EventParam("output", ethereum.Value.fromString(output))
  )
  promptsUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "callbackData",
      ethereum.Value.fromBytes(callbackData)
    )
  )

  return promptsUpdatedEvent
}
