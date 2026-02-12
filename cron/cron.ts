import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  createCronJob,
  cronJobTransactionKey,
  getCronJobForName,
  init as initCron,
} from "@helium/cron-sdk";
import {
  compileTransaction,
  getTaskQueueForName,
  init,
  taskQueueAuthorityKey,
} from "@helium/tuktuk-sdk";
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { sendInstructions } from "@helium/spl-utils";
import { TukTukScheduledVrf } from "../target/types/tuk_tuk_scheduled_vrf";

const vrf_program = anchor.workspace
  .tukTukScheduledVrf as Program<TukTukScheduledVrf>;

const user_acc = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("user-acc"), anchor.Wallet.local().publicKey.toBytes()],
  vrf_program.programId,
)[0];

async function main() {
  const argv = await yargs(hideBin(process.argv))
    .options({
      cronName: {
        type: "string",
        description: "Get random number from magic block vrf",
        demandOption: true,
      },
      queueName: {
        type: "string",
        description: "vrf-Queue",
        demandOption: true,
      },
      walletPath: {
        type: "string",
        description: "/Users/karthikeya/.config/solana/id.json ",
        demandOption: true,
      },
      rpcUrl: {
        type: "string",
        description: " https://api.devnet.solana.com ",
        demandOption: true,
      },
      message: {
        type: "string",
        description: "Why do we need memo here",
        default:
          "This will create a cron job for the Turbin3 Accel tuktuk counter program!",
      },
      fundingAmount: {
        type: "number",
        description: "Amount of SOL to fund the cron job with (in lamports)",
        default: 0.01 * LAMPORTS_PER_SOL,
      },
    })
    .help()
    .alias("help", "h").argv;
    
// {
//   "pubkey": "6WCWrKvZkK9As4PcMS3hTvbX4xgq2biuAQkhmvb48jf2",
//   "id": 195,
//   "capacity": 5,
//   "update_authority": "HGbe7AjNtNNuU3QmninLVZhcY1bJGEyuXVLrbw1EPyCW",
//   "name": "vrf-Queue",
//   "min_crank_reward": 1000000,
//   "balance": 1100000000,
//   "stale_task_age": 0
// }

  // Setup connection and provider
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const wallet = provider.wallet as anchor.Wallet;

  console.log("Using wallet:", wallet.publicKey.toBase58());
  console.log("RPC URL:", argv.rpcUrl);
  console.log("Message:", argv.message);

  // Initialize TukTuk program
  const program = await init(provider);
  const cronProgram = await initCron(provider);
  const taskQueue = await getTaskQueueForName(program, argv.queueName);

  // Check if task_queue_authority exists for this wallet, if not create it
  const taskQueueAuthorityPda = taskQueueAuthorityKey(
    taskQueue,
    wallet.publicKey,
  )[0];
    
    console.log("Checking if task queue authority exists for wallet... pda is: " + taskQueueAuthorityPda);
  const taskQueueAuthorityInfo = await provider.connection.getAccountInfo(
    taskQueueAuthorityPda,
  );

  if (!taskQueueAuthorityInfo) {
    console.log("Initializing task queue authority for wallet... " + wallet.publicKey.toBase58());
    await program.methods
      .addQueueAuthorityV0()
      .accounts({
        payer: wallet.publicKey,
        queueAuthority: wallet.publicKey,
        taskQueue,
      })
      .rpc({ skipPreflight: true });
    console.log("Task queue authority initialized!");
  } else {
    console.log("Task queue authority already exists");
  }

  // Check if cron job already exists
  let cronJob = await getCronJobForName(cronProgram, argv.cronName);
  console.log("Cron Job:", cronJob);
  if (!cronJob) {
    console.log("Creating new cron job...");
    const {
      pubkeys: { cronJob: cronJobPubkey },
    } = await (
      await createCronJob(cronProgram, {
        tuktukProgram: program,
        taskQueue,
        args: {
          name: argv.cronName,
          schedule: "0 * * * * *", // Run every minute
          // How many "free" tasks to allocate to this cron job per transaction (whitout paying crank fee)
          // The increment transaction doesn't need to schedule more transactions, so we set this to 0
          freeTasksPerTransaction: 0,
          // We just have one transaction to queue for each cron job, so we set this to 1
          numTasksPerQueueCall: 1,
        },
      })
    ).rpcAndKeys({ skipPreflight: false });
    cronJob = cronJobPubkey;
    console.log(
      "Funding cron job with",
      argv.fundingAmount / LAMPORTS_PER_SOL,
      "SOL",
    );
    await sendInstructions(provider, [
      SystemProgram.transfer({
        fromPubkey: provider.publicKey,
        toPubkey: cronJob,
        lamports: argv.fundingAmount,
      }),
    ]);
    // Create instruction
    const vrfInstruction = new TransactionInstruction({
      keys: [{ pubkey: user_acc, isSigner: false, isWritable: true }],
      data: vrf_program.coder.instruction.encode("sendVrfReq", {clientSeed:0}),
      programId: vrf_program.programId,
    });

    // Compile the instruction
    console.log("Compiling instructions...");
    const { transaction, remainingAccounts } = compileTransaction(
      [vrfInstruction],
      [],
    );

    // Adding brf_req_sender to the cron job
    await cronProgram.methods
      .addCronTransactionV0({
        index: 0,
        transactionSource: {
          compiledV0: [transaction],
        },
      })
      .accounts({
        payer: provider.publicKey,
        cronJob,
        cronJobTransaction: cronJobTransactionKey(cronJob, 0)[0],
      })
      .remainingAccounts(remainingAccounts)
      .rpc({ skipPreflight: true });
    console.log(`Cron job created!`);
  } else {
    console.log("Cron job already exists");
  }

  console.log("Cron job address:", cronJob.toBase58());
  console.log(
    `\nYour send vrf request will be posted every minute. Watch for transactions on task queue ${taskQueue.toBase58()}. To stop the cron job, use the tuktuk-cli:`,
  );
  console.log(
    `tuktuk -u ${argv.rpcUrl} -w ${argv.walletPath} cron-transaction close --cron-name ${argv.cronName} --id 0`,
  );
  console.log(
    `tuktuk -u ${argv.rpcUrl} -w ${argv.walletPath} cron close --cron-name ${argv.cronName}`,
  );
  await monitorTask(provider.connection, cronJob);
}

async function monitorTask(connection: Connection, task: PublicKey) {
  let taskAccount;
  do {
    try {
      taskAccount = await connection.getAccountInfo(task);
      if (!taskAccount) {
        const signature = await connection.getSignaturesForAddress(task, {
          limit: 1,
        });
        console.log(
          `Task completed! Transaction signature: ${signature[0].signature}`,
        );
        break;
      }
      console.log("Task is still pending...");
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (e) {
      console.log("Task completed!");
      break;
    }
  } while (true);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
