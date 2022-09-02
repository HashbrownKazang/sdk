import { z } from 'zod'
import { SoundAPILoginError, UnexpectedApiResponse } from '../errors'
import type { ExecutionResult } from '../types'
import { ApiEndpointsMap, ApiEnvironments } from '../utils/constants'
import {
  AudioFromTrack,
  AudioFromTrackQuery,
  AudioFromTrackQueryVariables,
  GenerateAuthChallenge,
  GenerateAuthChallengeMutation,
  GenerateAuthChallengeMutationVariables,
  ReleaseInfo,
  ReleaseInfoQuery,
  ReleaseInfoQueryVariables,
  Test,
  TestQuery,
  VerifyAuthChallenge,
  VerifyAuthChallengeMutation,
  VerifyAuthChallengeMutationVariables,
} from './graphql/gql'
import type { Signer } from '@ethersproject/abstract-signer'
import { loginMessageToSign } from '../constants'

const graphqlRequestBody = z.object({
  data: z.record(z.unknown()).nullable().optional(),
  errors: z
    .array(
      z.object({
        message: z.string(),
        locations: z.array(z.object({ line: z.number(), column: z.number() })).optional(),
        path: z.array(z.union([z.string(), z.number()])).optional(),
        extensions: z.record(z.unknown()).optional(),
      }),
    )
    .optional(),
  extensions: z.record(z.unknown()).optional(),
})

const CLIENT_KEY_HEADER = 'x-sound-client-key'

interface AuthTokenConfig {
  authToken: string
}

export function SoundAPI({
  environment = 'production',
  apiKey,
}: {
  /**
   * @default "production"
   */
  environment?: ApiEnvironments
  apiKey: string
} & Partial<AuthTokenConfig>) {
  const apiUrl = new URL(ApiEndpointsMap[environment])

  function graphqlRequest<
    Data extends Record<string, unknown> = Record<string, unknown>,
    Variables extends Record<string, unknown> = Record<string, never>,
  >({ query, variables }: { query: string; variables?: Variables }) {
    return fetch(apiUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        [CLIENT_KEY_HEADER]: apiKey,
      },
      body: JSON.stringify(
        variables
          ? {
              query,
              variables,
            }
          : {
              query,
            },
      ),
    })
      .then((response) =>
        response.json().then<ExecutionResult<Data>>(
          // @ts-expect-error
          graphqlRequestBody.parse,
        ),
      )
      .catch((err) => {
        throw new UnexpectedApiResponse(err)
      })
  }

  return {
    async check() {
      const response = await graphqlRequest<TestQuery>({
        query: Test,
      })

      return response.errors ? { errors: response.errors } : null
    },
    releaseInfo({ contractAddress, editionId = null }: ReleaseInfoQueryVariables) {
      return graphqlRequest<ReleaseInfoQuery, ReleaseInfoQueryVariables>({
        query: ReleaseInfo,
        variables: {
          contractAddress,
          editionId,
        },
      })
    },
    audioFromTrack({ trackId }: { trackId: string }) {
      return graphqlRequest<AudioFromTrackQuery, AudioFromTrackQueryVariables>({
        query: AudioFromTrack,
        variables: {
          trackId,
        },
      })
    },
    async login({ signer }: { signer: Signer }) {
      const publicAddress = (await signer.getAddress()).toLowerCase()

      const { data: authChallengeNonce, errors: authChallengeNonceErrors } = await graphqlRequest<
        GenerateAuthChallengeMutation,
        GenerateAuthChallengeMutationVariables
      >({
        query: GenerateAuthChallenge,
        variables: {
          publicAddress,
        },
      })

      if (authChallengeNonce == null) {
        throw new SoundAPILoginError({
          publicAddress,
          graphqlErrors: authChallengeNonceErrors,
        })
      }

      const signedMessage = loginMessageToSign(authChallengeNonce.generateAuthChallenge)

      const { data: authChallengeAuthToken, errors: authChallengeVerifyErrors } = await graphqlRequest<
        VerifyAuthChallengeMutation,
        VerifyAuthChallengeMutationVariables
      >({
        query: VerifyAuthChallenge,
        variables: {
          publicAddress,
          signedMessage,
        },
      })

      if (authChallengeAuthToken == null) {
        throw new SoundAPILoginError({
          publicAddress,
          graphqlErrors: authChallengeVerifyErrors,
        })
      }

      return {
        authToken: authChallengeAuthToken.verifyAuthChallenge,
      }
    },
  }
}
